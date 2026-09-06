import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { milestoneId, photoUrl, imagePrompt, userId } = await request.json();

    if (!milestoneId || !photoUrl || !imagePrompt || !userId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`[generate-milestone-image] Starting for milestone ${milestoneId}, prompt length: ${imagePrompt.length}`);

    // Genera imagen combinando foto del jugador con el prompt
    const buffer = await generatePlayerImage(photoUrl, imagePrompt);
    if (!buffer) {
      console.error(`[generate-milestone-image] Image generation returned null`);
      return Response.json(
        { error: "Image generation failed" },
        { status: 500 }
      );
    }

    // Sube la imagen generada
    const supabase = await createClient();
    const imageUrl = await uploadGeneratedImage(supabase, userId, buffer, "milestone");
    if (!imageUrl) {
      console.error(`[generate-milestone-image] Image upload failed`);
      return Response.json(
        { error: "Image upload failed" },
        { status: 500 }
      );
    }

    // Actualiza el milestone con la URL de la imagen
    const { error: updateError } = await supabase
      .from("milestones")
      .update({ image_url: imageUrl })
      .eq("id", milestoneId);

    if (updateError) {
      console.error(`[generate-milestone-image] Milestone update failed:`, updateError.message);
      return Response.json(
        { error: "Milestone update failed" },
        { status: 500 }
      );
    }

    console.log(`[generate-milestone-image] SUCCESS: milestone ${milestoneId} updated with image`);
    return Response.json({ success: true, imageUrl });
  } catch (error) {
    console.error("[generate-milestone-image] Exception:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
