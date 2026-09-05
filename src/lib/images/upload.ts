import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadGeneratedImage(
  supabase: SupabaseClient,
  userId: string,
  buffer: Buffer,
  prefix: string,
): Promise<string | null> {
  const path = `${userId}/${prefix}-${Date.now()}.png`;

  const { error } = await supabase.storage
    .from("player-photos")
    .upload(path, buffer, { contentType: "image/png", upsert: true });

  if (error) {
    console.error("[uploadGeneratedImage] storage upload failed", error.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("player-photos").getPublicUrl(path);

  return publicUrl;
}
