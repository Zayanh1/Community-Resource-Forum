"use client";

import type { PropsWithChildren } from "react";
import { useFormStatus } from "react-dom";

export default function DisplayPending({ children }: PropsWithChildren) {
  const { pending } = useFormStatus();

  return (
    <fieldset className="contents" disabled={pending}>
      {children}
    </fieldset>
  );
}
