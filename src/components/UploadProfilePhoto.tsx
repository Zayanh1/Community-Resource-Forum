"use client";

import type { profiles } from "~/server/db/schema/tables";
import Avatar from "./Avatar";

interface Props {
  profile: typeof profiles.$inferSelect;
}

export default function UploadProfilePhoto({ profile }: Props) {
  return (
    <label className="flex items-center gap-4 rounded-md border border-zinc-300 bg-white px-2 py-2 shadow-xs transition-[border-color,box-shadow] hover:border-zinc-400 hover:shadow-sm">
      {/* <span className="text-5xl/0">
        <Avatar {...profile} image={state?.status === "success" ? `/_uploads/${state?.data.uploadId}` : profile.image} />
      </span> */}
      <input type="file" />
    </label>
  );
}
