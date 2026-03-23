import { useCallback, useEffect, type DependencyList } from "react";

interface Options {
  target?: HTMLElement | Document;
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

export default function useKeydown(
  { key, target, ctrlKey = false, altKey = false, metaKey = false }: Options,
  callback: (e: KeyboardEvent) => void,
  deps: DependencyList,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handler = useCallback(callback, deps);

  useEffect(() => {
    const controller = new AbortController();
    (target ?? document).addEventListener(
      "keydown",
      //@ts-expect-error The compiler struggles with the inference here and settles on too general of a type
      (e: KeyboardEvent) => {
        console.log(target);
        if (
          e.key === key &&
          e.ctrlKey === ctrlKey &&
          e.altKey === altKey &&
          e.metaKey === metaKey
        ) {
          handler(e);
        }
      },
      controller,
    );
    return () => controller.abort();
  }, [handler, key, ctrlKey, altKey, metaKey, target]);
}
