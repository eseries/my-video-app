import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, prompt } = body;
    console.log("Received prompt:", prompt?.slice(0, 50));

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN in Vercel env" }, { status: 500 });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    const res = await fetch("https://api.replicate.com/v1/models/minimax/video-01/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
        "Prefer": "wait",
      },
      body: JSON.stringify({
        input: {
          prompt,
          first_frame_image: image,
          prompt_optimizer: true,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail || JSON.stringify(data) }, { status: res.status });
    }

    let prediction = data;
    while (prediction.status !== "succeeded" && prediction.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${token}` },
      });
      prediction = await poll.json();
    }

    if (prediction.status === "failed") {
      return NextResponse.json({ error: prediction.error }, { status: 500 });
    }

    const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    return NextResponse.json({ videoUrl });
  } catch (e: any) {
    console.error("CRITICAL ERROR:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
