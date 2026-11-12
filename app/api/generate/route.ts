import Replicate from 'replicate';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    let body: { image?: unknown; prompt?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { image, prompt } = body;
    if (typeof image !== 'string' || !image.startsWith('data:image')) {
      return NextResponse.json({ error: 'Image must be a valid image data URL.' }, { status: 400 });
    }
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }
    console.log('Incoming video prompt:', prompt);
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

    const output = await replicate.run('minimax/video-01', {
      input: { prompt: prompt.trim(), first_frame_image: image, prompt_optimizer: true },
    }) as any;

    const videoUrl = typeof output === 'string' ? output : output[0] || output.video;
    return NextResponse.json({ videoUrl });
  } catch (err: any) {
    console.error(err);
    if (err.message?.includes('402') || err.message?.includes('Insufficient credit')) {
      return NextResponse.json({ error: 'INSUFFICIENT_CREDIT: Please add $5 credit at replicate.com/account/billing' }, { status: 402 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
