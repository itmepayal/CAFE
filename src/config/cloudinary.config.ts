import fs from "fs";
import dotenv from "dotenv";
import { serverConfig } from ".";
import { v2 as cloudinary } from "cloudinary";
import { BadGatewayError, BadRequestError } from "../utils/errors/app.error";
import { logger } from "./logger.config";

dotenv.config();

cloudinary.config({
  cloud_name: serverConfig.CLOUDINARY_NAME!,
  api_key: serverConfig.CLOUDINARY_API_KEY!,
  api_secret: serverConfig.CLOUDINARY_API_SECRET!,
});

const removeLocalUpload = (filePath: string): void => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    logger.warn("Could not remove temporary upload file", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }
};

const redactCloudinarySecrets = (value?: string): string | undefined => {
  if (!value) return value;
  return [serverConfig.CLOUDINARY_API_KEY, serverConfig.CLOUDINARY_API_SECRET]
    .filter((secret): secret is string => Boolean(secret && secret.length >= 4))
    .reduce((result, secret) => result.split(secret).join("[REDACTED]"), value);
};

/**
 * =========================================================
 * UPLOAD FILE TO CLOUDINARY
 * =========================================================
 */
export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "cafe-mart",
): Promise<string> => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new BadRequestError("Uploaded file is missing from temporary storage");
  }

  try {
    const missingConfig = [
      ["CLOUDINARY_NAME", serverConfig.CLOUDINARY_NAME],
      ["CLOUDINARY_API_KEY", serverConfig.CLOUDINARY_API_KEY],
      ["CLOUDINARY_API_SECRET", serverConfig.CLOUDINARY_API_SECRET],
    ].filter(([, value]) => !value).map(([key]) => key);
    if (missingConfig.length) {
      throw new Error(`Cloudinary configuration missing: ${missingConfig.join(", ")}`);
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    if (!result.secure_url) throw new Error("Cloudinary returned no secure URL");
    removeLocalUpload(filePath);

    return result.secure_url;
  } catch (error) {
    removeLocalUpload(filePath);
    const original = error as Error & { code?: string | number };
    logger.error("Cloudinary upload failed", {
      errorName: original?.name,
      errorMessage: redactCloudinarySecrets(original?.message),
      errorCode: original?.code,
      stack: redactCloudinarySecrets(original?.stack),
      configurationMissing: !serverConfig.CLOUDINARY_NAME ||
        !serverConfig.CLOUDINARY_API_KEY || !serverConfig.CLOUDINARY_API_SECRET,
    });
    throw new BadGatewayError("Media upload service failed", error);
  }
};

/**
 * =========================================================
 * DELETE FILE FROM CLOUDINARY
 * =========================================================
 */
export const deleteFromCloudinary = async (
  publicUrl: string,
): Promise<void> => {
  try {
    if (!publicUrl) return;
    const uploadMarker = "/upload/";
    const markerIndex = publicUrl.indexOf(uploadMarker);
    if (markerIndex < 0) throw new Error("Invalid Cloudinary URL");

    const urlPath = publicUrl.slice(markerIndex + uploadMarker.length);
    const segments = urlPath.split("/");
    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const assetSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;
    const last = assetSegments.pop();
    if (!last) throw new Error("Invalid Cloudinary asset URL");
    assetSegments.push(last.replace(/\.[^.]+$/, ""));
    const publicId = decodeURIComponent(assetSegments.join("/"));
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    throw error;
  }
};

export default cloudinary;
