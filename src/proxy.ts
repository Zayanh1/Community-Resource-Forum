import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { db } from "~/server/db";
import { s3 } from "~/server/s3";
import * as permissions from "~/server/s3/permissions";
import type { PermissionTag } from "~/server/s3/permissions";
import { getSession } from "./server/auth";
import type { schema } from "./server/db/schema";

type OrganizationRole = (typeof schema.organizations.$inferSelect)["role"] & {};

const impliedRoles = {
  member: ["member", "officer", "owner"],
  officer: ["officer", "owner"],
  owner: ["owner"],
} satisfies Record<PermissionTag["access"]["write"], OrganizationRole[]>;

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/_uploads/")) {
    const segments = path.split("/");

    if (segments.length !== 3) {
      return NextResponse.next();
    }

    const upload = await db.query.uploads.findFirst({
      where: { id: segments[2] },
    });

    if (!upload) {
      return NextResponse.next();
    }

    const redirectToFile = async () =>
      NextResponse.rewrite(
        await getSignedUrl(
          //@ts-expect-error Most likely a library bug.
          s3,
          new GetObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: `${upload.ownerId}/${upload.id}`,
          }),
          { expiresIn: 60 },
        ),
      );

    const readAccessRole = permissions[upload.tag].access.read;

    // Is this file publicly accessible?
    if (readAccessRole === "public") {
      return await redirectToFile();
    }

    const session = await getSession({
      user: {
        columns: {},
        with: {
          organizationMemberships: {
            columns: { organizationProfileId: true, role: true },
            where: { organizationProfileId: upload.ownerId },
          },
        },
      },
    });

    // All future checks will require a valid session
    if (!session) {
      return NextResponse.next();
    }

    // Is file restricted only to users who are signed in?
    if (readAccessRole === "verified") {
      return await redirectToFile();
    }

    // Does this user own the file?
    if (session.userProfileId === upload.ownerId) {
      return await redirectToFile();
    }

    // If an organization owns this file, does the user have the minimum required role in said organization to access it?
    if (
      session.user.organizationMemberships.some((org) =>
        (impliedRoles[readAccessRole] as string[]).includes(org.role),
      )
    ) {
      return await redirectToFile();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next) to prevent breaking chunking on pages
    //"/((?!_next|api|static|public|favicon.ico).*)",
    "/_uploads/:id",
  ],
};
