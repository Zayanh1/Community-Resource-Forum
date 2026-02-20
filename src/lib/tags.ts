import { type tags as tagsTable } from "~/server/db/schema/tables";

export type Tag = typeof tagsTable.$inferSelect;

export function isAncestor(descendant: Tag, ancestor: Tag) {
  return (
    descendant.id !== ancestor.id &&
    ancestor.lft <= descendant.lft &&
    descendant.rgt <= ancestor.rgt
  );
}

export function reduceTags(selection: Tag[]) {
  return selection.filter(
    (tag) => !selection.some((other) => isAncestor(other, tag)),
  );
}
