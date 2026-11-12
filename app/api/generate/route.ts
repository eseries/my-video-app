import Replicate from 'replicate';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { image, prompt } = await req.json();
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });

    const output = await replicate.run('minimax/video-01', {
      input: { prompt, first_frame_image: image, prompt_optimizer: true },
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
