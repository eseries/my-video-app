import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { image, prompt, script, aspectRatio, duration, audio } = await req.json();
    const creativeBrief = script?.trim() || prompt?.trim();
    if (!creativeBrief) return NextResponse.json({ error: "Add a script or prompt." }, { status: 400 });
    const shotLength = Math.max(1, Number(duration || 5));
    const scriptShots = script?.split(/\n+/).map((shot: string) => shot.trim()).filter(Boolean).slice(0, Math.min(6, shotLength)) || [];
    const shotBase = Math.max(1, Math.floor(shotLength / Math.max(1, scriptShots.length)));
    const shots = scriptShots.map((shot: string, index: number) => ({ prompt: shot, duration: index === scriptShots.length - 1 ? shotLength - shotBase * (scriptShots.length - 1) : shotBase }));
    const res = await fetch("https://api.replicate.com/v1/models/kwaivgi/kling-v3-video/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: `${creativeBrief}\n\nCreate a coherent short film with clear shot changes, intentional camera movement, consistent characters, and synchronized spoken dialogue. ${audio ? "Generate natural dialogue, lip-synced mouth movement, ambient sound, and sound effects." : "Generate no audio."}`,
          ...(shots.length > 1 ? { multi_prompt: JSON.stringify(shots) } : {}),
          ...(image ? { start_image: image } : {}),
          duration: Number(duration || 5),
          aspect_ratio: aspectRatio || "16:9",
          generate_audio: Boolean(audio),
          mode: "standard",
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
