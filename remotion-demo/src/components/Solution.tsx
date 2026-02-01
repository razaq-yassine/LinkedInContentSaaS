import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface SolutionProps {
  brandName: string;
}

export const Solution: React.FC<SolutionProps> = ({ brandName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const brandScale = spring({
    frame: frame - 20,
    fps,
    config: {
      damping: 100,
    },
  });

  const descriptionOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const checkmarkScale = spring({
    frame: frame - 60,
    fps,
    config: {
      damping: 50,
    },
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: "100px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "1400px" }}>
        {/* Title */}
        <h2
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "white",
            marginBottom: "60px",
            opacity: titleOpacity,
            fontFamily: "Arial, sans-serif",
          }}
        >
          The Solution
        </h2>

        {/* Brand Name with emphasis */}
        <div style={{ marginBottom: "60px" }}>
          <h1
            style={{
              fontSize: "120px",
              fontWeight: "bold",
              color: "white",
              margin: 0,
              transform: `scale(${brandScale})`,
              fontFamily: "Arial, sans-serif",
              textShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
            }}
          >
            {brandName}
          </h1>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "48px",
            color: "rgba(255, 255, 255, 0.95)",
            marginBottom: "60px",
            opacity: descriptionOpacity,
            fontFamily: "Arial, sans-serif",
            fontWeight: "300",
            lineHeight: 1.5,
          }}
        >
          Your AI-powered LinkedIn content assistant that creates,
          <br />
          schedules, and optimizes posts in minutes
        </p>

        {/* Checkmark */}
        {frame > 60 && (
          <div
            style={{
              fontSize: "150px",
              transform: `scale(${checkmarkScale})`,
            }}
          >
            ✓
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
