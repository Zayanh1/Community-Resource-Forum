"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type RefObject,
  type FocusEvent,
} from "react";
import useKeydown from "~/hooks/useKeydown";

const mod = (a: number, b: number) => ((a % b) + b) % b;
const domTreePositionOrdering = (a: Node, b: Node) =>
  a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;

interface OptionRegistration {
  focus: () => void;
  cleanup: () => void;
}

interface ComboboxContext {
  focused: HTMLButtonElement | null;
  registerOption: (option: HTMLButtonElement) => OptionRegistration;
  inputRef: RefObject<HTMLInputElement | null>;
  popover: boolean;
}

const context = createContext<ComboboxContext | null>(null);

interface RootProps extends PropsWithChildren {
  popover?: boolean;
}

export function Root({ popover = false, children }: RootProps) {
  const options = useRef<HTMLButtonElement[]>([]);
  const [focused, setFocused] = useState<HTMLButtonElement | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const registerOption = useCallback((option: HTMLButtonElement) => {
    options.current.push(option);

    return {
      focus: () => {
        setFocused(option);
      },
      cleanup: () => {
        options.current = options.current.filter((el) => el.isSameNode(option));
      },
    };
  }, []);

  const handleFocus = useCallback((e: FocusEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setPopoverOpen(true);
      setFocused(options.current.toSorted(domTreePositionOrdering)[0] ?? null);
    }

    inputRef.current?.focus();
  }, []);

  const handleBlur = useCallback((e: FocusEvent) => {
    if (e.currentTarget.contains(e.relatedTarget)) {
      return;
    }

    setPopoverOpen(false);
  }, []);

  const selectNext = useCallback(() => {
    setFocused((el) => {
      if (options.current.length <= 0) {
        return null;
      }

      const opts = options.current.toSorted(domTreePositionOrdering);

      const currentIndex = opts.findIndex((other) => other.isSameNode(el));

      if (currentIndex === -1) {
        return opts[0] ?? null;
      }

      return opts[mod(currentIndex + 1, opts.length)]!;
    });
  }, []);

  const selectPrevious = useCallback(() => {
    setFocused((el) => {
      if (options.current.length <= 0) {
        return null;
      }

      const opts = options.current.toSorted(domTreePositionOrdering);

      const currentIndex = opts.findIndex((other) => other.isSameNode(el));

      if (currentIndex === -1) {
        return opts[0] ?? null;
      }

      return opts[mod(currentIndex - 1, opts.length)]!;
    });
  }, []);

  useKeydown(
    { key: "Escape", target: inputRef.current ?? undefined },
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      inputRef.current?.blur();
    },
    [],
  );

  useKeydown(
    { key: "Enter", target: inputRef.current ?? undefined },
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (focused) {
        focused.click();
        selectNext();
      }
    },
    [focused],
  );

  useKeydown(
    { key: "ArrowUp" },
    () => {
      selectPrevious();
    },
    [selectPrevious],
  );

  useKeydown(
    { key: "ArrowDown" },
    () => {
      selectNext();
    },
    [selectNext],
  );

  return (
    <context.Provider
      value={{
        focused,
        registerOption,
        inputRef,
        popover,
      }}
    >
      <div className="contents" onFocus={handleFocus} onBlur={handleBlur}>
        {popover ? (
          <Popover.Root open={popoverOpen}>{children}</Popover.Root>
        ) : (
          children
        )}
      </div>
    </context.Provider>
  );
}

export function Input(
  props: Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "ref"
  >,
) {
  const ctx = useContext(context);

  if (!ctx) {
    throw new Error(
      "<Combobox.Input /> must be a descendant of <Combobox.Root />",
    );
  }

  if (ctx.popover) {
    return (
      <Popover.Anchor asChild>
        <span className="block">
          <input {...props} ref={ctx.inputRef} />
        </span>
      </Popover.Anchor>
    );
  }

  return <input {...props} ref={ctx.inputRef} />;
}

export function Option(
  props: DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
) {
  const ctx = useContext(context);

  if (!ctx) {
    throw new Error(
      "<Combobox.Option /> must be a descendant of <Combobox.Root />",
    );
  }

  const ref = useRef<HTMLButtonElement>(null);
  const focused = !!ctx.focused?.isSameNode(ref.current);

  useEffect(() => {
    if (!ref.current || props.disabled) {
      return;
    }

    const self = ctx.registerOption(ref.current);
    const controller = new AbortController();

    ref.current?.addEventListener(
      "mouseenter",
      () => {
        self.focus();
      },
      {
        signal: controller.signal,
      },
    );

    return () => {
      controller.abort();
      self.cleanup();
    };
  }, [ctx, props.disabled]);

  useEffect(() => {
    if (focused) {
      ref.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
    }
  }, [focused]);

  return (
    <button
      type="button"
      {...props}
      data-focus={focused ? true : undefined}
      ref={ref}
    />
  );
}

export function Options({
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  const ctx = useContext(context);

  if (!ctx) {
    throw new Error(
      "<Combobox.Input /> must be a descendant of <Combobox.Root />",
    );
  }

  if (ctx.popover) {
    return (
      <div className="contents pointer-events-none *:pointer-events-none! *:relative *:z-100! *:w-(--radix-popper-anchor-width)">
        <Popover.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          sideOffset={4}
          side="bottom"
          forceMount
          {...props}
        >
          {children}
        </Popover.Content>
      </div>
    );
  }

  return <div {...props}>{children}</div>;
}
