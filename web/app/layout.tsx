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
  alternates: {
    canonical: "https://clipmer.app",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clipmer.app",
    siteName: "Clipmer",
    title: "Clipmer — Clipboard History Manager for Linux",
    description:
      "Clipboard history, search, pinned items and auto-paste — all in one lightweight Linux app.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipmer — Clipboard History Manager for Linux",
    description:
      "Clipboard history, search, pinned items and auto-paste — all in one lightweight Linux app.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Clipmer",
              description:
                "Clipboard history, search, pinned items and auto-paste — all in one lightweight Linux app for Ubuntu, GNOME, and Wayland.",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Linux",
              url: "https://clipmer.app",
              downloadUrl:
                "https://github.com/0x99M/project-y/releases/latest",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              license: "https://opensource.org/licenses/MIT",
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
