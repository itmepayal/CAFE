import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * =========================================================
 * UPLOAD FILE TO CLOUDINARY
 * =========================================================
 */
export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "cafe-mart",
): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto",
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
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
    const parts = publicUrl.split("/");
    const fileWithExt = parts[parts.length - 1];
    const publicId = parts.slice(-2, -1)[0] + "/" + fileWithExt.split(".")[0];
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    throw error;
  }
};

export default cloudinary;
