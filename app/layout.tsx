import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Monster Game · Clo's Little World",
  description:
    'Explore a playful 3D island with Clo, a friendly yellow monster. A gentle first adventure in counting, shapes and letter sounds.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
