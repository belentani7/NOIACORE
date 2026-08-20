import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Noiacore · Laboratorio de Arte Generativo",
  description:
    "Noiacore Art Lab — un estudio vivo para obras generativas con shaders GLSL. Crea, publica y colecciona arte que respira en tiempo real.",
  keywords: [
    "Noiacore",
    "arte generativo",
    "shaders",
    "GLSL",
    "WebGL",
    "laboratorio creativo",
    "arte digital",
  ],
  authors: [{ name: "Noiacore Lab" }],
  icons: { icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg" },
  openGraph: {
    title: "Noiacore · Laboratorio de Arte Generativo",
    description:
      "Estudio vivo para obras generativas con shaders GLSL. Crea, publica y colecciona arte que respira.",
    siteName: "Noiacore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Noiacore · Art Lab",
    description: "Estudio vivo para obras generativas con shaders GLSL.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
