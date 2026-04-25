import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Clipmer — Offline Clipboard Manager for Linux";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const iconData = await readFile(join(process.cwd(), "app", "icon.png"));
  const iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f0f0f",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(233, 84, 32, 0.12)",
            filter: "blur(120px)",
          }}
        />

        {/* Icon */}
        <img
          src={iconBase64}
          width={80}
          height={80}
          style={{ borderRadius: 16, marginBottom: 32 }}
        />

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            fontSize: 52,
            fontWeight: 700,
            color: "#EEEEEC",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: 800,
            gap: 12,
          }}
        >
          <span>Never lose a</span>
          <span style={{ color: "#E95420" }}>copied item again.</span>
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 24,
            color: "#888888",
            marginTop: 20,
            textAlign: "center",
          }}
        >
          Offline clipboard manager for Linux &middot; No telemetry
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "#E95420",
            opacity: 0.7,
          }}
        >
          clipmer.app
        </div>
      </div>
    ),
    { ...size }
  );
}
