"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import React, { useCallback, useId, useState } from "react";
import { PiHash, PiMagnifyingGlassBold, PiXBold } from "react-icons/pi";
import * as Combobox from "~/components/Combobox";
import useKeydown from "~/lib/useKeydown";
import useTagSelector from "~/lib/useTagSelector";
import type { tags as tagsTable } from "~/server/db/schema/tables";

interface Props {
  tags: (typeof tagsTable.$inferSelect)[];
}

export default function SearchDialog({ tags }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const id = useId();

  const { query, setQuery, queried, selected, reset } = useTagSelector(tags);

  const submitQuery = useCallback(() => {
    router.push(
      "/posts?" +
        new URLSearchParams([
          ["q", query],
          ...selected.map((result) => ["t", result.tag.id]),
        ]).toString(),
    );
    setIsOpen(false);
    reset();
    return;
  }, [router, selected, reset, query]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.focus();
  }, []);

  useKeydown(
    { ctrlKey: true, key: "k" },
    (e) => {
      e.preventDefault();
      setIsOpen((o) => !o);
    },
    [],
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger className="flex flex-1 cursor-text items-center gap-3 rounded-full border-b border-gray-200 px-3 py-1.5 text-sm text-gray-600 ring ring-gray-300">
        <PiMagnifyingGlassBold className="text-gray-400" />
        <span className="flex-1 text-left">Search Posts</span>
        <span className="text-[0.66rem] text-gray-500">Ctrl-K</span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 size-full bg-gray-950/20" />
        <Dialog.Content className="fixed top-2/5 left-1/2 z-40 w-[min(calc(100vw-2rem),var(--container-xl))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border border-sky-800 bg-white shadow-xl">
          <div className="flex w-full max-w-xl flex-col gap-2 bg-gray-200 px-4.25 py-3">
            <Dialog.Title className="-mx-px text-lg font-bold">
              Search Posts
            </Dialog.Title>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm/none empty:hidden">
              {selected.length > 0 && <p>Tagged with</p>}
              {selected.map((result) => (
                <div
                  key={result.tag.id}
                  className="flex overflow-hidden rounded-sm border border-sky-800 shadow-xs"
                >
                  <p className="line-clamp-1 flex-1 bg-white py-1 pr-6 pl-1.5 text-nowrap overflow-ellipsis">
                    {result.tag.name}
                  </p>
                  <button
                    type="button"
                    className="bg-sky-800 px-1.5 py-0.5 text-white transition-colors hover:bg-sky-700"
                    onClick={() => {
                      result.deselect();
                    }}
                  >
                    <PiXBold />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <label className="relative flex items-center gap-3 border-b border-sky-800 px-3">
              <PiMagnifyingGlassBold className="size-4 fill-gray-400" />

              <input
                className="w-full bg-white py-3 font-medium focus:outline-0"
                id={id}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find..."
                onBlur={handleBlur}
                value={query}
              />

              <span className="top-3.75 right-3 rounded-sm border-b-2 border-gray-300 bg-gray-50 px-1 py-px text-[0.66rem] text-gray-600 ring ring-gray-400">
                Esc
              </span>
            </label>

            <Combobox.Options className="z-60 w-full rounded-sm p-1 transition duration-100 ease-in [--anchor-gap:--spacing(1)] empty:invisible data-leave:data-closed:opacity-0">
              {query.length > 0 && (
                <Combobox.Option
                  className="group flex w-full cursor-default items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm text-gray-700 select-none data-focus:bg-gray-200"
                  onClick={submitQuery}
                >
                  Find posts containing
                  <span className="font-medium text-black before:font-normal before:text-gray-700 before:content-['\201C'] after:font-normal after:text-gray-700 after:content-['\201D']">
                    {query}
                  </span>
                </Combobox.Option>
              )}

              <span className="mx-auto my-1 block h-px w-[calc(100%-var(--spacing)*6)] rounded-full bg-gray-400 first:hidden last:hidden" />

              {queried.map((result) => (
                <Combobox.Option
                  key={result.tag.id}
                  className="group flex w-full disabled:opacity-60 disabled:cursor-not-allowed items-center gap-1.5 rounded-sm px-3 py-1 select-none data-focus:bg-gray-200"
                  onClick={() => result.select()}
                  disabled={result.disabled}
                >
                  {result.tag.depth === 0 ? (
                    <PiHash className="size-[1em] text-gray-500" />
                  ) : (
                    <span
                      className="ml-[calc(var(--spacing)*(var(--depth)*7.5))] block size-4 pr-0.5 pb-1.5"
                      style={
                        {
                          "--depth": result.tag.depth,
                        } as React.CSSProperties
                      }
                    >
                      <span className="block size-full rounded-bl-sm border-b-2 border-l-2 border-gray-400" />
                    </span>
                  )}

                  <div className="text-sm/6">{result.tag.name}</div>
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
