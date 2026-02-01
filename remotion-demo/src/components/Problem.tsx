import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const problemsOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const problems = [
    "❌ Spending hours crafting LinkedIn posts",
    "❌ Struggling to maintain consistent posting",
    "❌ Low engagement on your content",
    "❌ No data-driven insights",
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: "100px",
      }}
    >
      <div style={{ maxWidth: "1200px", width: "100%" }}>
        {/* Title */}
        <h2
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "white",
            marginBottom: "80px",
            textAlign: "center",
            opacity: titleOpacity,
            fontFamily: "Arial, sans-serif",
          }}
        >
          The Problem
        </h2>

        {/* Problems List */}
        <div style={{ opacity: problemsOpacity }}>
          {problems.map((problem, index) => {
            const itemDelay = 40 + index * 15;
            const itemOpacity = interpolate(frame, [itemDelay, itemDelay + 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const itemX = interpolate(frame, [itemDelay, itemDelay + 15], [-50, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={index}
                style={{
                  fontSize: "48px",
                  color: "rgba(255, 255, 255, 0.9)",
                  marginBottom: "40px",
                  opacity: itemOpacity,
                  transform: `translateX(${itemX}px)`,
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {problem}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
