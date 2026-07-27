import { File } from "expo-file-system";
import { supabase } from "@/lib/supabase/client";

interface UploadAvatarOptions {
  userId: string;
  imageUri: string;
}

export async function uploadAvatar({
  userId,
  imageUri,
}: UploadAvatarOptions): Promise<string> {
  // Remove previous avatars
  const { data: files } = await supabase.storage
    .from("avatars")
    .list(userId);

  if (files?.length) {
    const paths = files.map((file) => `${userId}/${file.name}`);

    const { error } = await supabase.storage
      .from("avatars")
      .remove(paths);

    if (error) throw error;
  }

  // File extension
  const extension =
    imageUri.split(".").pop()?.toLowerCase() || "jpg";

  const filePath = `${userId}/avatar-${Date.now()}.${extension}`;

  // Modern Expo File API
  const file = new File(imageUri);

  // Read as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Upload to Supabase
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, arrayBuffer, {
      contentType: `image/${extension}`,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return publicUrl;
}