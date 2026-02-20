"use server";

import { DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, gte, inArray, sql, sum } from "drizzle-orm";
import { unauthorized, unstable_rethrow } from "next/navigation";
import { env } from "~/env";
import type { PermissionTag } from "~/server/s3/permissions";
import * as permissions from "~/server/s3/permissions";
import { expectSession } from "../auth";
import { db } from "../db";
import { schema } from "../db/schema";
import { s3, type FileDetails, type UploadOptions } from "../s3";
import zip from "~/lib/zip";

type OrganizationRole = (typeof schema.organizations.$inferSelect)["role"] & {};

const impliedRoles = {
  member: ["member", "officer", "owner"],
  officer: ["officer", "owner"],
  owner: ["owner"],
} satisfies Record<PermissionTag["access"]["write"], OrganizationRole[]>;

export default async function createUpload(
  { ownerId, tag }: UploadOptions,
  fileDetails: FileDetails[],
) {
  try {
    const policy: PermissionTag = permissions[tag];

    if (fileDetails.some((file) => file.size > policy.accept.maxSize)) {
      return {
        status: "error",
        message: "At least one file is too big.",
      } as const;
    }

    if (
      fileDetails.some((file) => !policy.accept.mimeTypes.includes(file.type))
    ) {
      return {
        status: "error",
        message: "At least one file is of the wrong type.",
      } as const;
    }

    let requestedFileCount = fileDetails.length;
    let requestedStorageSpace = fileDetails.reduce(
      (sum, file) => sum + file.size,
      0,
    );

    if (requestedFileCount > policy.limits.maxFilesPerProfile) {
      return { status: "error", message: "Too many files." } as const;
    }

    if (requestedStorageSpace > policy.limits.maxStoragePerProfile) {
      return { status: "error", message: "Too many files." } as const;
    }

    const session = await expectSession({
      user: {
        columns: {},
        with: {
          profile: {
            columns: {},
            where: {
              id: ownerId,
            },
            with: {
              uploadUsage: {
                where: { tag },
              },
            },
          },
          organizationMemberships: {
            columns: {},
            where: {
              AND: [
                {
                  organizationProfileId: ownerId,
                },
                {
                  role: {
                    in: impliedRoles[policy.access.write],
                  },
                },
              ],
            },
            with: {
              profile: {
                columns: {},
                with: {
                  uploadUsage: {
                    where: {
                      tag,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const profile =
      session.user.profile ?? session.user.organizationMemberships[0]?.profile;

    if (!profile) {
      unauthorized();
    }

    const uploads = await db.transaction(async (tx) => {
      const usage = await tx.query.uploadUsages.findFirst({
        where: { tag, profileId: ownerId },
      });

      if (usage) {
        const objectsToDelete: { Key: string }[] = [];

        if (
          usage.fileCount + requestedFileCount >
          policy.limits.maxFilesPerProfile
        ) {
          if (policy.limits.preferOverwrite === "none") {
            return tx.rollback();
          }

          const ordering =
            policy.limits.preferOverwrite === "largest"
              ? schema.uploads.size
              : schema.uploads.createdAt;

          const deleteCount =
            usage.fileCount +
            requestedFileCount -
            policy.limits.maxFilesPerProfile;

          const overwriteTargets = await tx
            .select({ id: schema.uploads.id, size: schema.uploads.size })
            .from(schema.uploads)
            .where(
              and(
                eq(schema.uploads.ownerId, ownerId),
                eq(schema.uploads.tag, tag),
              ),
            )
            .orderBy(ordering)
            .limit(deleteCount);

          await tx
            .delete(schema.uploads)
            .where(
              and(
                eq(schema.uploads.ownerId, ownerId),
                eq(schema.uploads.tag, tag),
              ),
            )
            .orderBy(ordering)
            .limit(deleteCount);

          objectsToDelete.push(
            ...overwriteTargets.map((t) => ({
              Key: `${ownerId}/${t.id}`,
            })),
          );

          requestedFileCount -= deleteCount;
          requestedStorageSpace -= overwriteTargets.reduce(
            (sum, file) => sum + file.size,
            0,
          );
        }

        if (
          usage.bytesWritten + requestedStorageSpace >
          policy.limits.maxStoragePerProfile
        ) {
          if (policy.limits.preferOverwrite === "none") {
            return tx.rollback();
          }

          const deleteSize =
            usage.bytesWritten +
            requestedStorageSpace -
            policy.limits.maxStoragePerProfile;

          const ordering =
            policy.limits.preferOverwrite === "largest"
              ? schema.uploads.size
              : schema.uploads.createdAt;

          const overwriteTargets = await tx
            .select({ id: schema.uploads.id, size: schema.uploads.size })
            .from(schema.uploads)
            .where(
              and(
                eq(schema.uploads.ownerId, ownerId),
                eq(schema.uploads.tag, tag),
              ),
            )
            .groupBy(schema.uploads.id)
            .having(gte(sum(schema.uploads.size), deleteSize))
            .orderBy(ordering);

          await tx.delete(schema.uploads).where(
            inArray(
              schema.uploads.id,
              overwriteTargets.map((t) => t.id),
            ),
          );

          objectsToDelete.push(
            ...overwriteTargets.map((t) => ({
              Key: `${ownerId}/${t.id}`,
            })),
          );

          requestedFileCount -= overwriteTargets.length;
          requestedStorageSpace -= overwriteTargets.reduce(
            (sum, file) => sum + file.size,
            0,
          );
        }

        if (objectsToDelete.length > 0) {
          try {
            console.log({ objectsToDelete });
            const result = await s3.send(
              new DeleteObjectsCommand({
                Bucket: env.S3_BUCKET_NAME,
                Delete: {
                  Objects: objectsToDelete,
                },
              }),
            );
            console.log({ result });
          } catch (error) {
            console.error(error);
            return tx.rollback();
          }
        }
      }

      const insertedUploads = await tx
        .insert(schema.uploads)
        .values(fileDetails.map((file) => ({ ownerId, tag, ...file })))
        .$returningId();

      if (insertedUploads.length !== fileDetails.length) {
        return tx.rollback();
      }

      await tx
        .insert(schema.uploadUsages)
        .values({
          tag,
          profileId: ownerId,
          fileCount: requestedFileCount,
          bytesWritten: requestedStorageSpace,
        })
        .onDuplicateKeyUpdate({
          set: {
            fileCount: sql`values(${schema.uploadUsages.fileCount}) + ${schema.uploadUsages.fileCount}`,
            bytesWritten: sql`values(${schema.uploadUsages.bytesWritten}) + ${schema.uploadUsages.bytesWritten}`,
          },
        });

      try {
        return await Promise.all(
          zip(fileDetails, insertedUploads).map(async ([file, { id }]) => ({
            id,
            signedUrl: await getSignedUrl(
              //@ts-expect-error Most likely a library bug.
              s3,
              new PutObjectCommand({
                Bucket: env.S3_BUCKET_NAME,
                ContentType: file.type,
                ContentLength: file.size,
                ChecksumSHA256: file.contentHash,
                Key: `${ownerId}/${id}`,
              }),
              { expiresIn: 120 },
            ),
          })),
        );
      } catch (error) {
        console.error(error);
        return tx.rollback();
      }
    });

    return {
      status: "success",
      data: { uploads },
    } as const;
  } catch (error) {
    unstable_rethrow(error);
    console.error(error);
    return {
      status: "error",
      message: "An unknown error occurred.",
    } as const;
  }
}
