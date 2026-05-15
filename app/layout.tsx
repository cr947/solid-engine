import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agora Agent',
  description: 'AI-powered Polymarket prediction market agent dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
