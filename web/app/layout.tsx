import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANTAINE STUDIO",
  description: "Studio brain, MIDI console and docs — Alex & Antaine Music Studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
