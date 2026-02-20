import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  type HTMLAttributes,
} from "react";
import useKeydown from "~/lib/useKeydown";

type HTMLProps<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;

export function Options({ children, ...props }: HTMLProps<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const abortController = new AbortController();

    for (const child of ref.current.querySelectorAll("button:not(:disabled)")) {
      child.removeAttribute("data-focus");

      child.addEventListener(
        "mouseenter",
        (e) => {
          ref.current
            ?.querySelector("button[data-focus]")
            ?.removeAttribute("data-focus");
          (e.currentTarget as HTMLButtonElement).setAttribute(
            "data-focus",
            "true",
          );
        },
        {
          signal: abortController.signal,
        },
      );
    }

    ref.current
      .querySelector("button:not(:disabled)")
      ?.setAttribute("data-focus", "true");

    return () => abortController.abort();
  }, [children]);

  useKeydown(
    { key: "ArrowDown" },
    (e) => {
      if (!ref.current) {
        return;
      }

      e.preventDefault();

      const currentlySelected = ref.current.querySelector("button[data-focus]");
      const next =
        ref.current.querySelector("button[data-focus]~button:not(:disabled)") ??
        ref.current.querySelector("button:not(:disabled)");

      currentlySelected?.removeAttribute("data-focus");
      next?.setAttribute("data-focus", "true");
    },
    [],
  );

  useKeydown(
    { key: "ArrowUp" },
    (e) => {
      if (!ref.current) {
        return;
      }

      e.preventDefault();

      const currentlySelected = ref.current.querySelector("button[data-focus]");
      const all = ref.current.querySelectorAll("button:not(:disabled)");
      const prev = ref.current.querySelectorAll(
        "button:not(:disabled):has(~button[data-focus])",
      );
      const target = prev[prev.length - 1] ?? all[all.length - 1];

      currentlySelected?.removeAttribute("data-focus");
      target?.setAttribute("data-focus", "true");
    },
    [],
  );

  useKeydown(
    { key: "Enter" },
    (e) => {
      if (!ref.current) {
        return;
      }

      e.preventDefault();

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const target = ref.current.querySelector(
        "button[data-focus]",
      ) as HTMLButtonElement | null;
      target?.click();
    },
    [],
  );

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}

export function Option({
  ...props
}: DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return <button {...props} />;
}
