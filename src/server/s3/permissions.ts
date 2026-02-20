import type { schema } from "~/server/db/schema";

type OrganizationRole = (typeof schema.organizations.$inferSelect)["role"] & {};

export interface PermissionTag {
  accept: {
    mimeTypes: string[];
    maxSize: number;
  };
  access: {
    read: "public" | "verified" | OrganizationRole;
    write: OrganizationRole;
  };
  limits: {
    maxFilesPerProfile: number;
    maxStoragePerProfile: number;
    preferOverwrite: "oldest" | "largest" | "none";
  };
}

export const profileImage = {
  accept: {
    mimeTypes: ["image/jpeg", "image/png", "image/bmp", "image/gif"],
    maxSize: 1_000_000, // <1 MB
  },
  access: {
    read: "public", // Anyone can view profile images
    write: "owner", // But only profile owners can change them (users own their user profile)
  },
  limits: {
    maxFilesPerProfile: 1, // Only one image is allowed per profile
    maxStoragePerProfile: 1_000_000, // <1 MB
    preferOverwrite: "oldest",
  },
} satisfies PermissionTag;
