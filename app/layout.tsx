import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarkRoom',
  description:
    'A mobile-first rules trainer for learning mark-room scenarios with diagrams, findings, citations, and quiz practice.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
