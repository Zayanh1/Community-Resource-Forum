import { useCallback, useMemo, useState } from "react";
import { isAncestor, reduceTags, type Tag } from "./tags";

interface Selected {
  tag: Tag;
  deselect: () => void;
}

interface Queried {
  tag: Tag;
  disabled: boolean;
  select: () => void;
}

/**
 *
 * @param tags Sorted by `lft`
 * @returns
 */
export default function useTagSelector(tags: Tag[]) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Tag[]>([]);

  const deselect = useCallback((tag: Tag) => {
    setSelected((s) => s.filter((other) => tag.id !== other.id));
  }, []);

  const select = useCallback((tag: Tag) => {
    setSelected((s) => [...s, tag]);
    setQuery("");
  }, []);

  const reset = useCallback(() => {
    setSelected([]);
    setQuery("");
  }, []);

  const reducedSelection = useMemo<Selected[]>(
    () =>
      reduceTags(selected).map((tag) => ({
        tag,
        deselect: () => deselect(tag),
      })),
    [selected, deselect],
  );

  const queried = useMemo(
    () =>
      tags.filter(
        (tag) =>
          !reducedSelection.some(
            (result) => result.tag.id === tag.id || isAncestor(result.tag, tag),
          ) && tag.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, reducedSelection, tags],
  );

  const visibleTags = useMemo<Queried[]>(
    () =>
      tags
        .filter((tag) =>
          queried.some(
            (result) => tag.lft <= result.lft && result.rgt <= tag.rgt,
          ),
        )
        .map((tag) => ({
          tag,
          disabled: selected.some(
            (selection) =>
              selection.id === tag.id || isAncestor(selection, tag),
          ),
          select: () => select(tag),
        })),
    [queried, select, selected, tags],
  );

  return {
    query,
    setQuery,
    selected: reducedSelection,
    queried: visibleTags,
    reset,
  };
}
