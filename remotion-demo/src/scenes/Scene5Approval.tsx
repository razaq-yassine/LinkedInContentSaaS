import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Easing } from "remotion";

interface Scene5ApprovalProps {
  brandName: string;
}

export const Scene5Approval: React.FC<Scene5ApprovalProps> = ({ brandName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo stays in same position
  const logoY = -380;
  const logoScale = 0.35;

  // Topics cards pulse animation (to draw attention)
  const topicsPulseScale = interpolate(
    frame,
    [0, 20],
    [1, 1.02],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const topicsPulseOpacity = interpolate(
    frame,
    [0, 10, 20],
    [1, 0.95, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Approve button slides up from bottom
  const approveButtonY = spring({
    frame: frame - 10,
    fps,
    from: 100,
    to: 0,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  const approveButtonOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Approve button glow (before cursor arrives)
  const approveButtonGlow = interpolate(
    frame,
    [35, 40, 45],
    [0, 1, 0.6],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Cursor animation - moves to approve button
  const cursorX = interpolate(
    frame,
    [0, 25, 40],
    [0, 0, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorY = interpolate(
    frame,
    [0, 25, 40],
    [100, 100, 220],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorOpacity = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor click
  const cursorClick = interpolate(frame, [55, 57], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Button fill animation on click
  const buttonFillWidth = interpolate(frame, [57, 70], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Transition to next scene - fade out current content
  const contentOpacity = interpolate(frame, [85, 100], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // New screen slides in from right
  const newScreenX = interpolate(frame, [85, 110], [1920, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const newScreenOpacity = interpolate(frame, [85, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Topics for display
  const topics = [
    { icon: "🤖", text: "AI & Machine Learning" },
    { icon: "💼", text: "Product Development" },
    { icon: "🎯", text: "Leadership & Strategy" },
    { icon: "📊", text: "Data Analytics" },
  ];

  return (
    <AbsoluteFill>
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        }}
      />

      {/* Logo at top */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${logoY}px) scale(${logoScale})`,
          opacity: frame < 85 ? 1 : contentOpacity,
        }}
      >
        <img
          src={staticFile("logo-dark.png")}
          alt={brandName}
          style={{
            height: "180px",
            width: "auto",
            filter: "drop-shadow(0 4px 12px rgba(255, 255, 255, 0.3))",
          }}
        />
      </div>

      {/* Current content - Topics approval */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          opacity: contentOpacity,
        }}
      >
        {/* Title */}
        <h3
          style={{
            fontSize: "32px",
            fontWeight: "600",
            color: "white",
            marginBottom: "32px",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
          }}
        >
          🎯 Your Content Topics
        </h3>

        {/* Topics grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "48px",
            opacity: topicsPulseOpacity,
            transform: `scale(${topicsPulseScale})`,
          }}
        >
          {topics.map((topic, index) => (
            <div
              key={index}
              style={{
                background: "rgba(0, 119, 181, 0.1)",
                border: "2px solid rgba(0, 119, 181, 0.3)",
                borderRadius: "16px",
                padding: "24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "rgba(0, 119, 181, 0.2)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  flexShrink: 0,
                }}
              >
                {topic.icon}
              </div>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "white",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {topic.text}
              </span>
            </div>
          ))}
        </div>

        {/* Approve button */}
        {frame >= 10 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              transform: `translateY(${approveButtonY}px)`,
              opacity: approveButtonOpacity,
            }}
          >
            <div style={{ position: "relative" }}>
              {/* Button glow */}
              {frame >= 35 && approveButtonGlow > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: "-8px",
                    background: `rgba(0, 119, 181, ${approveButtonGlow * 0.3})`,
                    borderRadius: "20px",
                    filter: "blur(20px)",
                  }}
                />
              )}

              {/* Button */}
              <button
                style={{
                  position: "relative",
                  padding: "18px 64px",
                  fontSize: "20px",
                  fontWeight: "600",
                  color: frame >= 57 ? "white" : "#0077B5",
                  background: frame >= 57 ? "#0077B5" : "transparent",
                  border: "2px solid #0077B5",
                  borderRadius: "16px",
                  cursor: "pointer",
                  fontFamily: "Arial, sans-serif",
                  overflow: "hidden",
                  boxShadow: frame >= 57 ? "0 8px 24px rgba(0, 119, 181, 0.4)" : "none",
                }}
              >
                {/* Fill animation */}
                {frame >= 57 && buttonFillWidth > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: `${buttonFillWidth}%`,
                      height: "100%",
                      background: "#0077B5",
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Button text */}
                <span style={{ position: "relative", zIndex: 1 }}>
                  Continue to Generate
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New screen - Generation page preview */}
      {frame >= 85 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateX(${newScreenX}px)`,
            opacity: newScreenOpacity,
          }}
        >
          {/* Logo at top */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translateY(${logoY}px) scale(${logoScale})`,
            }}
          >
            <img
              src={staticFile("logo-dark.png")}
              alt={brandName}
              style={{
                height: "180px",
                width: "auto",
                filter: "drop-shadow(0 4px 12px rgba(255, 255, 255, 0.3))",
              }}
            />
          </div>

          {/* Generation page preview */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "1000px",
            }}
          >
            <h2
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "white",
                marginBottom: "24px",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
              }}
            >
              ✨ Generate Your Post
            </h2>

            {/* Prompt textarea preview */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "2px solid rgba(0, 119, 181, 0.3)",
                borderRadius: "20px",
                padding: "32px",
                minHeight: "200px",
              }}
            >
              <label
                style={{
                  fontSize: "16px",
                  color: "#94a3b8",
                  marginBottom: "12px",
                  display: "block",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                What do you want to write about?
              </label>
              <div
                style={{
                  width: "100%",
                  minHeight: "150px",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "18px",
                  color: "#94a3b8",
                  fontFamily: "Arial, sans-serif",
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ opacity: 0.5 }}>Type your prompt here...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cursor */}
      {cursorOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(${cursorX}px, ${cursorY}px) scale(${cursorClick})`,
            opacity: cursorOpacity,
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))" }}>
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </div>
      )}
    </AbsoluteFill>
  );
};
