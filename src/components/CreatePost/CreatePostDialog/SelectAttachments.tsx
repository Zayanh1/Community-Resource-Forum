"use client";

import { useState, type ComponentProps } from "react";
import { PiLinkBold } from "react-icons/pi";
import { createAttachmentUpload } from "~/server/actions/post";
import FilePicker from "../../FilePicker";

export default function SelectAttachments(
  props: Omit<ComponentProps<typeof FilePicker>, "value" | "onChange" | "getPresignedUrls">,
) {
  const [files, setFiles] = useState<string[]>([]);

  return (
    <>
      {files.map((contentHash) => (
        <input
          type="hidden"
          name="attachments"
          value={contentHash}
          key={contentHash}
        />
      ))}
      <label className="flex w-full flex-col gap-1.5">
        <span className="mx-auto flex w-full items-center gap-2 font-bold">
          <PiLinkBold /> Attach Files
        </span>

        <FilePicker {...props} value={files} onChange={setFiles} getPresignedUrls={createAttachmentUpload} />
      </label>
    </>
  );
}
