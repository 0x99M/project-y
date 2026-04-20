import Link from "next/link";
import { Footer } from "@/components/sections/footer";

export function LegalLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border py-4">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to Clipmer
          </Link>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_strong]:text-foreground [&_a]:text-orange [&_li]:ml-4">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
