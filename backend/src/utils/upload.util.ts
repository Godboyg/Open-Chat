import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export const saveProfileImage = async (file: File) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  const uploadDir = join(process.cwd(), "uploads/profile-images");

  mkdirSync(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  writeFileSync(filePath, buffer);

  return `/uploads/profile-images/${fileName}`;
};