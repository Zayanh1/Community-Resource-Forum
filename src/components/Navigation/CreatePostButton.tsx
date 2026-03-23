"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { PiPlus } from "react-icons/pi";
import { useCreatePost } from "~/components/CreatePost/CreatePostContext";

export default function CreatePostButton() {
  const createPost = useCreatePost();

  return (
    <Dropdown.Item onSelect={createPost}>
      <button className="flex w-full items-center gap-3 py-1 pr-6 pl-3 transition-colors hover:bg-gray-200">
        <PiPlus />
        New Post
      </button>
    </Dropdown.Item>
  );
}
