import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) return NextResponse.json({ error: 'REPLICATE_API_TOKEN is not configured.' }, { status: 500 });
    const replicate = new Replicate({ auth: token });

    if (request.headers.get('content-type')?.includes('application/json')) {
      const { action, videoUrl } = await request.json();
      if (action !== 'enhance' || typeof videoUrl !== 'string' || !videoUrl) {
        return NextResponse.json({ error: 'A video URL is required.' }, { status: 400 });
      }
      const output = await replicate.run('nightmareai/real-esrgan', {
        input: { image: videoUrl, scale: 4, face_enhance: true },
      });
      const enhancedOutput = Array.isArray(output) ? output[0] : output;
      const enhancedUrl = typeof enhancedOutput === 'string'
        ? enhancedOutput
        : (enhancedOutput as { url?: () => string }).url?.();
      if (!enhancedUrl) throw new Error('Replicate returned no enhanced media URL.');
      return NextResponse.json({ videoUrl: enhancedUrl });
    }

    const form = await request.formData();
    const image = form.get('image');
    const prompt = form.get('prompt');
    if (!(image instanceof File) || typeof prompt !== 'string' || !prompt.trim()) return NextResponse.json({ error: 'Image and prompt are required.' }, { status: 400 });
    if (!image.type.startsWith('image/')) return NextResponse.json({ error: 'The uploaded file must be an image.' }, { status: 400 });

    const imageBytes = Buffer.from(await image.arrayBuffer()).toString('base64');
    const imageUrl = `data:${image.type};base64,${imageBytes}`;
    const motionPrompt = prompt.trim();
    // replicate.run waits for the prediction to finish before returning its output.
    const output = await replicate.run('zsxkib/cogvideox-5b', {
      input: {
        image: imageUrl,
        prompt: motionPrompt,
        duration: 5,
        aspect_ratio: 'auto',
        cfg_scale: 0.5,
        enhance_prompt: true,
        negative_prompt: 'blurry, distorted, cartoon, low quality, warp, morph',
      },
    });
    const videoOutput = Array.isArray(output) ? output[0] : output;
    const videoUrl = typeof videoOutput === 'string'
      ? videoOutput
      : (videoOutput as { url?: () => string }).url?.();
    if (!videoUrl) throw new Error('Replicate returned no video URL.');
    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error('Video generation failed:', error);
    const replicateError = error as { status?: number; response?: { status?: number } };
    const status = replicateError.status ?? replicateError.response?.status;
    if (status === 402 || (error instanceof Error && /\b402\b|insufficient credit/i.test(error.message))) {
      return NextResponse.json({ error: 'No Replicate credit, please add $5 at replicate.com/account/billing' }, { status: 402 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Video generation failed.' }, { status: 500 });
  }
}
