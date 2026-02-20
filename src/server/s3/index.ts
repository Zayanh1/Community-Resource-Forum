import { S3Client } from "@aws-sdk/client-s3";
import { env } from "~/env";
import type * as permissions from "~/server/s3/permissions";

export const s3 = new S3Client({
  endpoint: `${env.S3_HOST.includes("localhost") ? "http" : "https"}://${env.S3_HOST}:${env.S3_PORT}`,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export interface FileDetails {
  size: number;
  type: string;
  contentHash: string;
}

export interface UploadOptions {
  ownerId: string;
  tag: keyof typeof permissions;
}