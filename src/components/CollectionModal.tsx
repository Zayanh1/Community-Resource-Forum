"use client";

import { useState, useEffect } from "react";
import { getUserCollections, createCollection, setPostCollections } from "~/server/actions/collection";

interface Props {
  postId: string;
  initialSelected: string[];
  onClose: () => void;
}

type Collection = {
  id: string;
  name: string;
  description: string | null;
};

export default function CollectionModal({ postId, initialSelected, onClose }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getUserCollections().then(setCollections);
  }, []);

  const toggleSelection = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await setPostCollections(postId, Array.from(selected));
    setIsSaving(false);
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createCollection(name, description);
    const updated = await getUserCollections();
    setCollections(updated);
    
    // Automatically select the newly created collection
    const newCol = updated.find(c => c.name === name);
    if (newCol) {
      const next = new Set(selected);
      next.add(newCol.id);
      setSelected(next);
    }
    
    setIsCreating(false);
    setName("");
    setDescription("");
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="w-96 rounded-xl bg-white p-6 text-gray-900 shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Save to Collection</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none">✕</button>
        </div>

        {isCreating ? (
          <div className="space-y-4">
            <input
              className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Collection Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="w-full rounded-md border border-gray-300 bg-white p-2.5 text-gray-900 outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 rounded-md border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 rounded-md bg-sky-700 py-2 font-semibold text-white hover:bg-sky-600 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-4">
              {collections.map((col) => (
                <label
                  key={col.id}
                  className="flex items-center gap-3 w-full rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(col.id)}
                    onChange={() => toggleSelection(col.id)}
                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 leading-tight">{col.name}</div>
                    {col.description && <div className="text-xs text-gray-500 mt-0.5">{col.description}</div>}
                  </div>
                </label>
              ))}
              {collections.length === 0 && (
                <p className="text-sm text-gray-500 py-4 text-center">No collections yet.</p>
              )}
            </div>
            
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full rounded-md border border-gray-300 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span> New Collection
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full rounded-md bg-sky-700 py-2.5 font-semibold text-white hover:bg-sky-600 disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}