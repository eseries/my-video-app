import Replicate from "replicate";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { image, prompt } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
    const output: any = await replicate.run("minimax/video-01", {
      input: { prompt: prompt || "cinematic slow push-in, subtle movement", first_frame_image: image, prompt_optimizer: true },
    });
    const videoUrl = typeof output === "string" ? output : output[0] || output.video;
    return NextResponse.json({ videoUrl });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
