import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { config } from "../../config/env";
import { AppError } from "../../middleware/error";

const s3 = config.aws.s3Bucket
  ? new S3Client({
      region: config.aws.region,
      credentials:
        config.aws.accessKeyId && config.aws.secretAccessKey
          ? {
              accessKeyId: config.aws.accessKeyId,
              secretAccessKey: config.aws.secretAccessKey
            }
          : undefined
    })
  : undefined;

export async function createPresignedUpload(input: {
  ownerId: string;
  fileName: string;
  contentType: string;
}) {
  if (!s3 || !config.aws.s3Bucket) {
    throw new AppError(500, "S3 is not configured", "S3_NOT_CONFIGURED");
  }

  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${input.ownerId}/${randomUUID()}-${safeName}`;
  const command = new PutObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: key,
    ContentType: input.contentType
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 });

  return {
    url,
    key,
    expiresIn: 300
  };
}
