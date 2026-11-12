import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Video App', description: 'Turn a still image into a moving scene.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
