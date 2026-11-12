'use client';

import { ChangeEvent, DragEvent, useState } from 'react';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function choose(file?: File) { if (!file?.type.startsWith('image/')) return setError('Please choose an image file.'); setImage(file); setPreview(URL.createObjectURL(file)); setError(''); setVideoUrl(''); }
  function onInput(e: ChangeEvent<HTMLInputElement>) { choose(e.target.files?.[0]); }
  function onDrop(e: DragEvent<HTMLLabelElement>) { e.preventDefault(); choose(e.dataTransfer.files[0]); }
  async function generate() {
    if (!image || !prompt.trim()) return setError('Add an image and a prompt to continue.');
    setLoading(true); setError(''); setVideoUrl('');
    const imageData = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = () => reject(new Error('Could not read the image.')); reader.readAsDataURL(image); });
    try { const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imageData, prompt: prompt.trim() }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Generation failed.'); setVideoUrl(data.videoUrl); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); } finally { setLoading(false); }
  }
  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 md:py-20">
    <div className="mb-12 flex items-end justify-between"><div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-orange-600">My Video App</p><h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Give a still<br />some motion.</h1></div><span className="hidden text-sm text-neutral-500 md:block">Image → video</span></div>
    <section className="grid gap-6 md:grid-cols-[1.1fr_.9fr]">
      <label onDragOver={e => e.preventDefault()} onDrop={onDrop} className="group flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-300 bg-white p-8 text-center transition hover:border-orange-400">
        {preview ? <img src={preview} alt="Selected source" className="max-h-[300px] rounded-2xl object-contain" /> : <><div className="mb-4 text-5xl">＋</div><p className="font-medium">Drop an image here</p><p className="mt-2 text-sm text-neutral-500">or click to browse · PNG, JPG, WEBP</p></>}
        <input type="file" accept="image/*" onChange={onInput} className="hidden" />
      </label>
      <div className="flex flex-col rounded-3xl bg-neutral-900 p-7 text-white"><label htmlFor="prompt" className="mb-3 text-sm text-neutral-400">Describe the motion</label><textarea id="prompt" placeholder="e.g. Cinematic 35mm film, slow push-in, subtle head movement, natural lighting, speaks calmly..." value={prompt} onChange={e => setPrompt(e.target.value)} rows={7} className="resize-none rounded-2xl border border-neutral-700 bg-neutral-800 p-4 text-sm outline-none ring-orange-500 focus:ring-2" /><button onClick={generate} disabled={loading} className="mt-auto rounded-full bg-orange-500 px-6 py-4 font-semibold text-neutral-950 transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60">{loading ? 'Creating your video…' : 'Generate video →'}</button>{error && <p className="mt-4 text-sm text-red-300">{error.startsWith('INSUFFICIENT_CREDIT:') ? 'Out of free credit. Add $5 at replicate.com/account/billing - this gives you ~20 videos' : error}</p>}</div>
    </section>
    {videoUrl && <section className="mt-8 rounded-3xl bg-white p-5"><video controls autoPlay loop src={videoUrl} className="w-full rounded-2xl" /></section>}
    <p className="mt-10 text-xs text-neutral-500">Powered by an open image-to-video workflow.</p>
  </main>;
}
