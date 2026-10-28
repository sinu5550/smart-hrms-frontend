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
   * Resize and compress an image client-side to ensure it is under 200KB (Hikvision limit: max 200KB JPG)
   */
  async optimizeImageUnder200KB(file: File | Blob): Promise<Blob> {
    return new Promise((resolve) => {
      // If already under 180KB and is JPEG, can return directly
      if (file.size <= 180 * 1024 && file.type === "image/jpeg") {
        return resolve(file);
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        const maxDim = 800; // 800x800 is ideal for biometric face recognition & profile pictures

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        // Fill white background in case of transparent PNG/WEBP
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Quality stepping to guarantee file size is strictly under 190KB
        const tryQuality = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              if (blob.size <= 190 * 1024 || q <= 0.4) {
                resolve(blob);
              } else {
                tryQuality(Math.max(0.3, q - 0.15));
              }
            },
            "image/jpeg",
            q
          );
        };

        tryQuality(0.85);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  },

  /**
   * Upload an image file directly to Cloudinary using unsigned upload preset
   */
  async uploadImage(file: File | Blob, folder: string = "hrms"): Promise<string> {
    // Automatically optimize to under 200KB JPG for Hikvision hardware compatibility
    const optimizedBlob = await this.optimizeImageUnder200KB(file);

    const formData = new FormData();
    formData.append("file", optimizedBlob, "face.jpg");
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
