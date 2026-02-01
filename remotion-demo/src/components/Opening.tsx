import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface OpeningProps {
  brandName: string;
  tagline: string;
}

export const Opening: React.FC<OpeningProps> = ({ brandName, tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 100,
    },
  });

  const taglineOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [40, 60], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {/* Logo/Brand Name */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            marginBottom: "40px",
          }}
        >
          <h1
            style={{
              fontSize: "120px",
              fontWeight: "bold",
              color: "white",
              margin: 0,
              textShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {brandName}
          </h1>
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
          }}
        >
          <p
            style={{
              fontSize: "48px",
              color: "rgba(255, 255, 255, 0.9)",
              margin: 0,
              fontFamily: "Arial, sans-serif",
              fontWeight: "300",
            }}
          >
            {tagline}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
