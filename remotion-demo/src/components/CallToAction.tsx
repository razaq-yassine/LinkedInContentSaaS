import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface CallToActionProps {
  brandName: string;
}

export const CallToAction: React.FC<CallToActionProps> = ({ brandName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buttonScale = spring({
    frame: frame - 30,
    fps,
    config: {
      damping: 100,
    },
  });

  const pulseScale = interpolate(
    frame,
    [60, 75, 90, 105],
    [1, 1.1, 1, 1.1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "extend",
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        {/* Main CTA Text */}
        <h2
          style={{
            fontSize: "84px",
            fontWeight: "bold",
            color: "white",
            marginBottom: "40px",
            opacity: textOpacity,
            fontFamily: "Arial, sans-serif",
          }}
        >
          Start Creating Better Content Today
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontSize: "42px",
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: "60px",
            opacity: textOpacity,
            fontFamily: "Arial, sans-serif",
            fontWeight: "300",
          }}
        >
          Join thousands of creators using {brandName}
        </p>

        {/* CTA Button */}
        {frame > 30 && (
          <div
            style={{
              display: "inline-block",
              backgroundColor: "white",
              color: "#667eea",
              fontSize: "48px",
              fontWeight: "bold",
              padding: "30px 80px",
              borderRadius: "50px",
              transform: `scale(${buttonScale * pulseScale})`,
              fontFamily: "Arial, sans-serif",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            Get Started Free
          </div>
        )}

        {/* Website URL */}
        {frame > 50 && (
          <div
            style={{
              marginTop: "60px",
              fontSize: "36px",
              color: "rgba(255, 255, 255, 0.8)",
              opacity: interpolate(frame, [50, 70], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              fontFamily: "Arial, sans-serif",
            }}
          >
            www.potinai.com
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
