"use client";

import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeUp } from "@/components/fade-up";
import { cn } from "@/lib/utils";

export function DownloadSection() {
  return (
    <section className="relative py-24 lg:py-32" id="download">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <FadeUp>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to take control of{" "}
            <span className="text-orange">your clipboard?</span>
          </h2>
        </FadeUp>

        <FadeUp delay={0.1}>
          <p className="mt-4 text-muted-foreground text-lg">
            Download Clipmer and never lose a copied item again.
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="mt-4 flex justify-center">
            <Badge
              variant="outline"
              className="border-orange/30 bg-orange/10 text-orange font-mono"
            >
              v2.0.6
            </Badge>
          </div>
        </FadeUp>

        <FadeUp delay={0.3}>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="https://github.com/0x99M/project-y/releases/download/v2.0.6/clipmer_2.0.6_amd64.deb"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-14 gap-2 px-8 text-base bg-orange text-white hover:bg-orange-hover"
              )}
            >
              <Download className="size-5" />
              Download .deb Package
            </a>
            <a
              href="https://github.com/0x99M/project-y/releases/download/v2.0.6/Clipmer-2.0.6.AppImage"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-14 gap-2 px-8 text-base border-border hover:bg-surface"
              )}
            >
              <Download className="size-5" />
              Download AppImage
            </a>
          </div>
        </FadeUp>

        <FadeUp delay={0.4}>
          <p className="mt-6 text-sm text-muted-foreground">
            Requires Ubuntu 20.04+ / GNOME / Wayland
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
