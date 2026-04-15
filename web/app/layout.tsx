import type { Metadata } from "next";
import { Ubuntu, Ubuntu_Mono } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const ubuntuMono = Ubuntu_Mono({
  variable: "--font-ubuntu-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Clipmer — Clipboard History Manager for Linux",
  description:
    "Clipboard history, search, pinned items and auto-paste — all in one lightweight Linux app. Built for Ubuntu, GNOME, and Wayland.",
  keywords: [
    "clipboard manager",
    "clipboard history",
    "linux clipboard",
    "ubuntu clipboard",
    "wayland clipboard",
    "gnome clipboard",
    "clipboard search",
    "auto paste",
  ],
  authors: [{ name: "Clipmer" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clipmer.app",
    siteName: "Clipmer",
    title: "Clipmer — Clipboard History Manager for Linux",
    description:
      "Clipboard history, search, pinned items and auto-paste — all in one lightweight Linux app.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Clipmer — Clipboard History Manager for Linux",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipmer — Clipboard History Manager for Linux",
    description:
      "Clipboard history, search, pinned items and auto-paste — all in one lightweight Linux app.",
    images: ["/og-image.png"],
  },
  metadataBase: new URL("https://clipmer.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${ubuntu.variable} ${ubuntuMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
