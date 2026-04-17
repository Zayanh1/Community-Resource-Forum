"use client";

import { useState, useEffect } from "react";
import CollectionModal from "./CollectionModal";
import { PiBookmarkSimpleBold, PiBookmarkSimpleFill } from "react-icons/pi";
import { getPostCollectionIds } from "~/server/actions/collection";

export default function BookmarkButton({ postId }: { postId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedCollectionIds, setSavedCollectionIds] = useState<string[]>([]);

  const fetchStatus = () => {
    void getPostCollectionIds(postId).then(setSavedCollectionIds);
  };

  useEffect(() => {
    fetchStatus();
  }, [postId]);

  const isBookmarked = savedCollectionIds.length > 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`transition-colors ${isBookmarked ? "text-sky-600 hover:text-sky-700" : "text-gray-400 hover:text-gray-600"}`}
        title="Manage Collections"
      >
        {isBookmarked ? <PiBookmarkSimpleFill size={24} /> : <PiBookmarkSimpleBold size={24} />}
      </button>

      {isOpen && (
        <CollectionModal
          postId={postId}
          initialSelected={savedCollectionIds}
          onClose={() => {
            setIsOpen(false);
            fetchStatus(); // Refresh status after modal closes
          }}
        />
      )}
    </>
  );
}