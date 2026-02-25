import type { Metadata } from "next";
import { Silkscreen, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-pixel-heading",
  display: "swap",
});

const pixelifySans = Pixelify_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-pixel-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gartic Phone",
  description: "Tegn og gjett med venner",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" className={`${silkscreen.variable} ${pixelifySans.variable}`}>
      <body className="bg-retro-black text-text-primary min-h-screen retro-bg">
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
