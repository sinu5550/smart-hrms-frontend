import axios from "axios";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "jawcusfd";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ekhone-hrms";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export const CloudinaryService = {
  /**
   * Upload an image file directly to Cloudinary using unsigned upload preset
   */
  async uploadImage(file: File | Blob, folder: string = "hrms"): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const response = await axios.post<CloudinaryUploadResponse>(uploadUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data || !response.data.secure_url) {
      throw new Error("Failed to upload image to Cloudinary.");
    }

    return response.data.secure_url;
  },
};
