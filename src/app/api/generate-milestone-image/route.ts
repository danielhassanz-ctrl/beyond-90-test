import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePlayerImage } from "@/lib/images/replicate";
import { uploadGeneratedImage } from "@/lib/images/upload";

export async function POST(req: NextRequest) {
  try {
    const { milestoneId, photoUrl, imagePrompt, userId } = await req.json();

    if (!milestoneId || !photoUrl || !imagePrompt || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Genera la imagen en background (no espera)
    // Esta función se ejecuta sin bloquear la respuesta
    (async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );

      const buffer = await generatePlayerImage(photoUrl, imagePrompt);
      if (buffer) {
        const imageUrl = await uploadGeneratedImage(supabase, userId, buffer, "hito");
        if (imageUrl) {
          // Actualiza el milestone con la imagen generada
          await supabase
            .from("milestones")
            .update({ image_url: imageUrl })
            .eq("id", milestoneId);
        }
      }
    })();

    // Responde inmediatamente sin esperar a que termine la generación
    return NextResponse.json({ success: true, milestoneId });
  } catch (error) {
    console.error("[generate-milestone-image]", error);
    return NextResponse.json({ error: "Failed to start image generation" }, { status: 500 });
  }
}
