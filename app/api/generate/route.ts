import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { image, prompt, script, aspectRatio, duration, audio } = await req.json();
    const creativeBrief = script?.trim() || prompt?.trim();
    if (!creativeBrief) return NextResponse.json({ error: "Add a script or prompt." }, { status: 400 });
    const res = await fetch("https://api.replicate.com/v1/models/minimax/video-01/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: `${creativeBrief}\n\nCreate a coherent short film with clear shot changes, intentional camera movement, consistent characters, and a ${aspectRatio || "16:9"} composition. Target duration: ${duration || "5"} seconds. ${audio ? "Include natural dialogue and ambient sound where appropriate." : "Do not rely on generated audio."}`,
          ...(image ? { first_frame_image: image } : {}),
          prompt_optimizer: true,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail || JSON.stringify(data) }, { status: res.status });
    }
    return NextResponse.json({ id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
