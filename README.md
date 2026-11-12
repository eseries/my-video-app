# my-video-app

A minimal image-to-video app built with Next.js 14, Tailwind CSS, and Replicate’s `lucataco/cogvideox-5b`. The flow follows the open-source Open-Sora pattern: image conditioning plus a motion prompt produces a video output.

## Local setup

1. Create a Replicate API token.
2. Copy `.env.example` to `.env.local` and set `REPLICATE_API_TOKEN`.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`.

## GitHub → Vercel

Push this folder to a GitHub repository, import that repository in Vercel, and add `REPLICATE_API_TOKEN` under Project Settings → Environment Variables for Production (and Preview if needed). Deploy with the defaults: Vercel detects Next.js automatically.

Generation runs server-side so the token is never exposed to the browser. Replicate output URLs may be temporary; persist the generated asset in object storage if your product needs durable video history.
