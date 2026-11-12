import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return NextResponse.json({ error: 'REPLICATE_API_TOKEN is not configured.' }, { status: 500 });
    const form = await request.formData();
    const image = form.get('image');
    const prompt = form.get('prompt');
    if (!(image instanceof File) || typeof prompt !== 'string' || !prompt.trim()) return NextResponse.json({ error: 'Image and prompt are required.' }, { status: 400 });
    if (!image.type.startsWith('image/')) return NextResponse.json({ error: 'The uploaded file must be an image.' }, { status: 400 });

    const imageBytes = Buffer.from(await image.arrayBuffer()).toString('base64');
    const imageUrl = `data:${image.type};base64,${imageBytes}`;
    const motionPrompt = prompt.trim();
    const replicate = new Replicate({ auth: token });

    // replicate.run waits for the prediction to finish before returning its output.
    const output = await replicate.run('minimax/video-01', {
      input: { prompt: motionPrompt, first_frame_image: imageUrl },
    });
    const videoOutput = Array.isArray(output) ? output[0] : output;
    const videoUrl = typeof videoOutput === 'string'
      ? videoOutput
      : (videoOutput as { url?: () => string }).url?.();
    if (!videoUrl) throw new Error('Replicate returned no video URL.');
    return NextResponse.json({ videoUrl });
  } catch (error) { console.error('Video generation failed:', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Video generation failed.' }, { status: 500 }); }
}
