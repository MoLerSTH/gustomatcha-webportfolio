import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Hattakorn Pongsawai (Gusto) | Backend, AI Systems & 3D Web Architect',
  description:
    'Interactive 3D Neo-Brutalist portfolio of Hattakorn Pongsawai (Gusto / MoLerSTH) — Software Engineering student at Thammasat University (TEP/TEPE), Backend & AI Systems Architect.',
  keywords: [
    'Hattakorn Pongsawai',
    'Gusto',
    'MoLerSTH',
    'Software Engineering',
    'Thammasat University',
    'FastAPI',
    'Next.js',
    'Three.js',
    'AI Systems',
  ],
  authors: [{ name: 'Hattakorn Pongsawai', url: 'https://github.com/MoLerSTH' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFFFF',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="neo-grid-bg min-h-screen antialiased flex flex-col">
        <a href="#main-content" className="skip-link visually-hidden">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
