"use client";

import type { profiles } from "~/server/db/schema/tables";
import Avatar from "./Avatar";

interface Props {
  profile: typeof profiles.$inferSelect;
}

export default function UploadProfilePhoto({ profile }: Props) {
  return (
    <label className="flex items-center gap-4 transition-[border-color,box-shadow] px-2 py-2 bg-white border rounded-md border-zinc-300 shadow-xs hover:shadow-sm hover:border-zinc-400">
      {/* <span className="text-5xl/0">
        <Avatar {...profile} image={state?.status === "success" ? `/_uploads/${state?.data.uploadId}` : profile.image} />
      </span> */}
      <input type="file" />
    </label>
  );
}