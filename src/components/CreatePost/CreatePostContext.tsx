"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction
} from "react";

interface PostContext {
  defaultValue: unknown;
  setDefaultValue: Dispatch<SetStateAction<PostContext["defaultValue"]>>;
  open: boolean;
  setOpen: Dispatch<SetStateAction<PostContext["open"]>>;
}

const PostContext = createContext<PostContext | null>(null);

export function Provider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [defaultValue, setDefaultValue] =
    useState<PostContext["defaultValue"]>();

  return (
    <PostContext value={{ open, setOpen, defaultValue, setDefaultValue }}>
      {children}
    </PostContext>
  );
}

export function useCreatePostContext() {
  const context = useContext(PostContext);

  if (!context) {
    throw new Error(
      "Any component with `useCreatePost()` must be a descendant of <CreatePostProvider />.",
    );
  }

  return context;
}

export function useCreatePost() {
  const context = useCreatePostContext();

  return useCallback(
    (defaultValue?: PostContext["defaultValue"]) => {
      context.setDefaultValue(defaultValue);
      context.setOpen(true);
    },
    [context],
  );
}
