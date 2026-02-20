import { v2 as cloudinary } from "cloudinary";

export const saveProfileImage = async (
  file: File
): Promise<{ url: string; publicId: string }> => {
  
  const buffer = Buffer.from(await file.arrayBuffer());

  console.log("buffer",buffer);

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
  try {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "uploads/profile-images",
        resource_type: "image", // important
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("No result from Cloudinary"));
          return;
        }

        console.log("Cloudinary Success:", result.secure_url);

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.on("error", (err) => {
      console.error("Stream Error:", err);
      reject(err);
    });

    stream.end(buffer);

  } catch (err) {
    console.error("Outer Error:", err);
    reject(err);
  }
});
};