import { useCallback, useMemo, useState, useTransition } from "react";
import type { FileDetails } from "~/server/s3/createUpload/defineUploads";

export interface FileState {
  file: File;
  details: string;
  discard: () => void;
}

type MaybeAsync<T> = T | Promise<T>;

type Result<T, R> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      data?: T;
      error: R;
    };

async function hashFileContents(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function useUploadWith<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P extends any[],
  R extends { presignedUrls: Record<string, string> },
>(getPresignedUrls: (...params: P) => MaybeAsync<R>) {
  const [state, setState] = useState<Record<string, FileState>>({});
  const [result, setResult] = useState<Result<R, unknown>>();
  const [isPending, startTransition] = useTransition();

  const dispatch = useCallback(
    (...params: P) => {
      startTransition(async () => {
        try {
          const data: R = await getPresignedUrls(...params);

          setResult(
            await Promise.all(
              Object.keys(state).map(async (contentHash) => {
                const file = state[contentHash]!.file;
                const destination = data.presignedUrls[contentHash];

                if (!destination) {
                  throw new Error(`Missing presigned URL for ${file.name}`);
                }

                const response = await fetch(destination, {
                  method: "PUT",
                  body: file,
                  headers: { "Content-Type": file.type },
                });

                if (!response.ok) {
                  throw new Error(response.statusText);
                }
              }),
            )
              .then(() => ({ ok: true, data }) as const)
              .catch((error: unknown) => ({ ok: false, data, error }) as const),
          );
        } catch (error) {
          setResult({ ok: false, error });
        }
      });
    },
    [state, getPresignedUrls],
  );

  const discard = useCallback((contentHash: string) => {
    setState((s) =>
      Object.fromEntries(
        Object.entries(s).filter(([key]) => contentHash !== key),
      ),
    );
  }, []);

  const prepare = useCallback(
    (files: File[]) => {
      startTransition(async () => {
        const preparedFiles = await Promise.all(
          files.map(async (file) => {
            const contentHash = await hashFileContents(file);

            const details = JSON.stringify({
              contentHash,
              size: file.size,
              type: file.type,
            } satisfies FileDetails);

            return [
              contentHash,
              {
                file,
                details,
                discard: discard.bind(useUploadWith, contentHash),
              },
            ] as const;
          }),
        );

        setState((s) => ({
          ...s,
          ...Object.fromEntries(preparedFiles),
        }));
      });
    },
    [discard],
  );

  const files = useMemo(() => Object.values(state), [state]);

  return {
    isPending,
    prepare,
    dispatch,
    files,
    result,
  };
}
