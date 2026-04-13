"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
  type PropsWithChildren,
} from "react";
import {
  PiArrowSquareOutBold,
  PiCheckBold,
  PiCircleNotch,
  PiFile,
  PiUploadSimpleBold,
  PiXBold,
} from "react-icons/pi";
import getFileDetails from "~/lib/getFileDetails";
import type { schema } from "~/server/db/schema";
import type { FileDetails, UploadResult } from "~/server/s3";

type ProfileWithUploads = Pick<
  typeof schema.profiles.$inferSelect,
  "name" | "id"
> & {
  uploads: (typeof schema.uploads.$inferSelect)[];
};

interface Option extends FileDetails {
  uploadPending: boolean;
  selected: boolean;
}

interface Props {
  profile: ProfileWithUploads;
  multiple?: boolean;
  allowTypes?: string[];
  getPresignedUrls: (
    ownerId: string,
    fileDetails: FileDetails[],
  ) => Promise<UploadResult>;
  value: string[];
  onChange: (value: string[]) => void;
}

export default function FilePicker({
  profile,
  onChange,
  multiple = false,
  getPresignedUrls,
  allowTypes = [],
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [triggerDragOver, setTriggerDragOver] = useState(false);
  const [inputDragOver, setInputDragOver] = useState(false);
  const [_, startTransition] = useTransition();
  const [options, setOptions] = useState<Option[]>(() =>
    profile.uploads.map((f) => ({
      ...f,
      uploadPending: false,
      selected: false,
    })),
  );

  const handleTriggerDragEnter = useCallback(() => {
    setTriggerDragOver(true);
  }, []);

  const handleTriggerDragLeave = useCallback(() => {
    setTriggerDragOver(false);
  }, []);

  const handleInputDragEnter = useCallback(() => {
    setInputDragOver(true);
  }, []);

  const handleInputDragLeave = useCallback(() => {
    setInputDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUpload = useCallback(
    (files: File[]) => {
      startTransition(async () => {
        const details = (
          await Promise.all(files.map((file) => getFileDetails(file)))
        ).filter((file) => {
          if (options.every((opt) => opt.contentHash !== file.contentHash)) {
            return true;
          }

          console.log("dupe!");

          setOptions((opt) =>
            opt.map((f) =>
              f.contentHash === file.contentHash ? { ...f, selected: true } : f,
            ),
          );

          return false;
        });

        const presignedUrls = await getPresignedUrls(profile.id, details);

        await Promise.all(
          presignedUrls.map(async ({ presignedUrl, ...file }) => {
            setOptions((opt) => [
              { ...file, uploadPending: true, selected: false },
              ...opt,
            ]);

            const result = await fetch(presignedUrl, {
              method: "PUT",
              headers: { ContentType: file.type },
            });

            if (!result.ok) {
              setOptions((opt) =>
                opt.filter((f) => f.contentHash !== file.contentHash),
              );
              return;
            }

            setOptions((opt) =>
              opt.map((f) =>
                f.contentHash === file.contentHash
                  ? { ...f, uploadPending: false, selected: true }
                  : f,
              ),
            );
          }),
        );
      });
    },
    [getPresignedUrls, profile, options],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      handleUpload(Array.from(e.dataTransfer.files));
    },
    [handleUpload],
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.currentTarget.files) {
        handleUpload(Array.from(e.currentTarget.files));
      }
    },
    [handleUpload],
  );

  const handleTriggerDrop = useCallback(
    (e: DragEvent) => {
      setTriggerDragOver(false);
      setOpen(true);
      handleDrop(e);
    },
    [handleDrop],
  );

  const createSelectionChangeHandler = useCallback((contentHash: string) => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const checked = e.currentTarget.checked;
      setOptions((opt) =>
        opt.map((f) =>
          f.contentHash === contentHash
            ? {
                ...f,
                selected: !f.uploadPending && checked,
              }
            : f,
        ),
      );
    };
  }, []);

  useEffect(() => {
    onChange(options.filter((f) => f.selected).map((f) => f.contentHash));
  }, [onChange, options]);

  // const handleChange = useCallback(
  //   (e: ChangeEvent<HTMLInputElement>) => {
  //     if (e.currentTarget.files) {
  //       prepareFiles(Array.from(e.currentTarget.files));
  //     }
  //   },
  //   [prepareFiles],
  // );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-gray-400 bg-white py-3 text-sm font-medium text-gray-800 data-drag-over:border-solid data-drag-over:border-sky-600 data-drag-over:shadow-md"
          onDragEnter={handleTriggerDragEnter}
          onDragLeave={handleTriggerDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleTriggerDrop}
          data-drag-over={triggerDragOver || undefined}
          type="button"
        >
          <span className="pointer-events-none flex items-center justify-center gap-2 group-hover:text-gray-500 group-data-drag-over:text-black">
            <PiUploadSimpleBold />
            Drag File Here
          </span>
          <span className="pointer-events-none text-[0.66rem] text-gray-500 uppercase">
            Or
          </span>
          <span className="pointer-events-none flex items-center justify-center gap-2 group-hover:text-black group-data-drag-over:text-gray-500">
            Click to Select from Previous Uploads <PiArrowSquareOutBold />
          </span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed z-110 h-dvh w-dvw bg-black/40" />

        <Dialog.Content className="fixed top-1/2 left-1/2 z-120 flex max-h-dvh w-dvw max-w-xl -translate-1/2 flex-col px-4 py-6">
          <div className="flex w-full flex-col gap-3 rounded-md border border-gray-400 bg-white py-3">
            <div className="flex items-center justify-between px-4">
              <Dialog.Title className="text-lg font-bold">
                Files Belonging to {profile.name}
              </Dialog.Title>
              <Dialog.Close>
                <PiXBold />
              </Dialog.Close>
            </div>

            <div className="grid grid-cols-3">
              <div className="bg-scroll-shadow col-span-2 grid h-max max-h-64 grid-cols-subgrid grid-rows-[repeat(auto-fill,1fr)] gap-2 overflow-y-scroll px-4 py-1.5">
                {options.map((file) => (
                  <label
                    className="checked:border-blue relative flex items-center gap-1.5 rounded-sm border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-800 transition-[box-shadow,border-color,background-color,text-color] hover:border-gray-300 hover:shadow-xs has-checked:border-sky-600 has-checked:bg-sky-100 has-checked:text-black"
                    key={file.contentHash}
                  >
                    <input
                      className="peer hidden"
                      name={id}
                      type={multiple ? "checkbox" : "radio"}
                      checked={file.selected}
                      onChange={createSelectionChangeHandler(file.contentHash)}
                      disabled={file.uploadPending}
                    />
                    <span className="block">
                      <PiFile />
                    </span>
                    <span className="w-full grow overflow-hidden overflow-ellipsis whitespace-nowrap">
                      {file.name}
                    </span>
                    <span className="hidden text-gray-500 peer-disabled:block">
                      <PiCircleNotch className="animate-spin" />
                    </span>
                    <span className="pointer-events-none absolute right-0 bottom-0 block aspect-square translate-1 rounded-full bg-sky-600 p-px text-[0.66rem] text-white opacity-0 transition-opacity peer-checked:opacity-100">
                      <PiCheckBold />
                    </span>
                  </label>
                ))}
              </div>
              <div className="border-l border-gray-200 px-4 py-1.5">
                <label
                  className="flex size-full items-center justify-center rounded-sm border border-dashed border-gray-400 bg-gray-100 px-2 py-4 text-center text-sm text-balance text-gray-800 hover:underline data-drag-over:border-solid data-drag-over:border-sky-600 data-drag-over:bg-sky-100 data-drag-over:text-black data-drag-over:shadow-xs"
                  data-drag-over={inputDragOver || undefined}
                  onDragEnter={handleInputDragEnter}
                  onDragLeave={handleInputDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    className="hidden"
                    type="file"
                    onChange={handleFileInputChange}
                    accept={allowTypes.join(",")}
                    multiple={multiple}
                  />
                  Drag or click here to upload a new file
                </label>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
