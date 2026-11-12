import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { id } = await req.json();
  const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
  });
  const data = await poll.json();

  if (data.status === "succeeded") {
    const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    return NextResponse.json({ status: "succeeded", videoUrl });
  }
  if (data.status === "failed") {
    return NextResponse.json({ status: "failed", error: data.error }, { status: 500 });
  }
  return NextResponse.json({ status: data.status });
}
