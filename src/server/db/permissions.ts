import { sql } from "drizzle-orm";
import type { permissionGroups } from "./schema/tables";

const Permission = {
  CREATE_POSTS: 1 << 0,
  CREATE_PRIVATE_POSTS: 1 << 1,
  CREATE_EVENTS: 1 << 2,
  CREATE_PRIVATE_EVENTS: 1 << 3,
  CREATE_COMMENTS: 1 << 4,
  MODERATE_COMMENTS: 1 << 5,
  MODERATE_POSTS: 1 << 6,
  MODERATE_EVENTS: 1 << 7,
  EDIT_PERMISSION_GROUPS: 1 << 8,
  EDIT_PROFILE: 1 << 9,
  ASSIGN_PERMISSION_GROUPS: 1 << 10,
  ASSIGN_ROLES: 1 << 11,
  APPROVE_MEMBERSHIPS: 1 << 12,
  MODERATE_MEMBERSHIPS: 1 << 13,
  UPLOAD_FILES: 1 << 14,
};

export default Permission;

export function hasPermissions(
  ...permissions: [keyof typeof Permission, ...(keyof typeof Permission)[]]
) {
  return (alias: typeof permissionGroups) =>
    sql`${alias.permissions} & ${permissions.reduce((sum, key) => sum & Permission[key], Number.MAX_SAFE_INTEGER)} != 0`;
}
