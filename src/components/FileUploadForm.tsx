"use client";

import {
  startTransition,
  type DetailedHTMLProps,
  type FormHTMLAttributes,
} from "react";
import createUpload from "~/server/actions/createUpload";
import type { FileDetails, UploadOptions } from "~/server/s3";
import zip from "../lib/zip";

type FormAction = (formData: FormData) => Promise<void> | void;

async function getFileDetails(file: File) {
  const fileContents = await file.arrayBuffer();
  const digestBuffer = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(fileContents),
  );
  const contentHash = Array.from(new Uint8Array(digestBuffer), (bytes) =>
    bytes.toString(16).padStart(2, "0"),
  ).join("");

  return {
    contentHash,
    size: file.size,
    type: file.type,
  } satisfies FileDetails;
}

function withFileUpload(
  formAction: FormAction,
  fileInputs: Record<string, UploadOptions>,
) {
  return async function startFormAction(formData: FormData) {
    startTransition(async () => {
      await Promise.all(
        Object.entries(fileInputs).map(async ([name, options]) => {
          const files = formData
            .getAll(name)
            .filter((data) => data instanceof File)
            .filter((file) => file.size > 0);

          if (files.length <= 0) {
            return;
          }

          const fileDetails = await Promise.all(
            files.map((file) => getFileDetails(file)),
          );

          const result = await createUpload(options, fileDetails);

          if (result.status === "error") {
            throw new Error(result.message);
          }

          if (result.data.uploads.length !== files.length) {
            throw new Error("Could not create uploads for all files.");
          }

          formData.delete(name);

          await Promise.all(
            zip(result.data.uploads, files).map(([{ id, signedUrl }, file]) =>
              fetch(signedUrl, {
                method: "PUT",
                body: file,
                headers: {
                  "Content-Type": file.type,
                },
              }).then((response) => {
                if (!response.ok) {
                  throw new Error("Upload failed.");
                }

                formData.append(name, id);
              }),
            ),
          );
        }),
      );

      startTransition(() => {
        void formAction(formData);
      });
    });
  };
}

interface Props
  extends DetailedHTMLProps<
    FormHTMLAttributes<HTMLFormElement>,
    HTMLFormElement
  > {
  action: FormAction;
  fileInputs: Record<string, UploadOptions>;
}

export default function FileUploadForm({
  action,
  fileInputs,
  ...props
}: Props) {
  return <form {...props} action={withFileUpload(action, fileInputs)} />;
}
