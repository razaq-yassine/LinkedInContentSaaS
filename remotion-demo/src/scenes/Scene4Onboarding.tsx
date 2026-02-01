import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Easing } from "remotion";

interface Scene4OnboardingProps {
  brandName: string;
}

export const Scene4Onboarding: React.FC<Scene4OnboardingProps> = ({ brandName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo stays in same position from Scene 3 (no transition needed)
  const logoY = -380; // Same as Scene 3 final position
  const logoScale = 0.35; // Same as Scene 3 final scale

  // Cursor animation - continues from Scene 3
  // Move cursor to file area (simulating picking up a file)
  const cursorX = interpolate(
    frame,
    [0, 15, 30, 50, 70],
    [0, -600, -600, 0, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorY = interpolate(
    frame,
    [0, 15, 30, 50, 70],
    [-80, -200, -200, 100, 100],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorOpacity = interpolate(frame, [0, 5, 70, 75], [1, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor click/drag state
  const isDragging = frame >= 30 && frame <= 50;
  const cursorScale = isDragging ? 0.9 : 1;

  // Dragged file icon follows cursor
  const draggedFileOpacity = interpolate(frame, [30, 35, 50, 55], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Page title - typewriter
  const titleText = "Let's set up your profile";
  const titleCharsToShow = Math.floor(
    interpolate(frame, [5, 25], [0, titleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const titleOpacity = interpolate(frame, [5, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Upload section appears
  const uploadY = spring({
    frame: frame - 25,
    fps,
    from: 50,
    to: 0,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  const uploadOpacity = interpolate(frame, [25, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CV file appears when dropped (from cursor drag)
  const cvFileScale = spring({
    frame: frame - 50,
    fps,
    from: 0.8,
    to: 1,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  const cvFileOpacity = interpolate(frame, [50, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Progress bar
  const progressWidth = interpolate(frame, [80, 120], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const progressOpacity = interpolate(frame, [75, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // AI analyzing animation
  const aiScanOpacity = interpolate(
    frame,
    [85, 90, 120, 125],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const scanLineY = interpolate(frame, [85, 120], [0, 300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "extend",
  });

  // Results appear - skills/topics
  const resultsY = spring({
    frame: frame - 125,
    fps,
    from: 50,
    to: 0,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  const resultsOpacity = interpolate(frame, [125, 135], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Topics/skills items stagger
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

      {/* Logo at top - stays in same position from Scene 3 */}
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

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
        }}
      >
        {/* Title - Typewriter */}
        {frame >= 5 && (
          <div style={{ textAlign: "center", opacity: titleOpacity }}>
            <h2
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
                fontFamily: "Arial, sans-serif",
              }}
            >
              {titleText.substring(0, titleCharsToShow)}
              {frame < 25 && titleCharsToShow < titleText.length && (
                <span style={{ opacity: 0.5 }}>|</span>
              )}
            </h2>
            <p
              style={{
                fontSize: "18px",
                color: "#94a3b8",
                marginTop: "12px",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Upload your CV to personalize your content
            </p>
          </div>
        )}

        {/* Upload Area */}
        {frame >= 25 && (
          <div
            style={{
              width: "600px",
              transform: `translateY(${uploadY}px)`,
              opacity: uploadOpacity,
            }}
          >
            <div
              style={{
                border: `2px dashed ${isDragging ? "rgba(0, 119, 181, 0.8)" : "rgba(148, 163, 184, 0.4)"}`,
                borderRadius: "20px",
                padding: "60px 40px",
                textAlign: "center",
                background: isDragging ? "rgba(0, 119, 181, 0.1)" : "rgba(15, 23, 42, 0.5)",
                position: "relative",
                minHeight: "200px",
                transition: "all 0.3s ease",
              }}
            >
              {/* Upload icon or CV file */}
              {frame < 50 ? (
                <div>
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0077B5"
                    strokeWidth="2"
                    style={{ margin: "0 auto 20px" }}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p
                    style={{
                      fontSize: "18px",
                      color: "white",
                      fontWeight: "600",
                      marginBottom: "8px",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    Drop your CV here
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#94a3b8",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    PDF, DOCX up to 10MB
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    transform: `scale(${cvFileScale})`,
                    opacity: cvFileOpacity,
                  }}
                >
                  {/* CV File preview */}
                  <div
                    style={{
                      background: "rgba(0, 119, 181, 0.1)",
                      border: "2px solid #0077B5",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      position: "relative",
                    }}
                  >
                    {/* PDF Icon */}
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        background: "#0077B5",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: "28px", color: "white" }}>📄</span>
                    </div>

                    {/* File info */}
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <p
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "white",
                          margin: 0,
                          fontFamily: "Arial, sans-serif",
                        }}
                      >
                        John_Doe_CV.pdf
                      </p>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#94a3b8",
                          margin: "4px 0 0 0",
                          fontFamily: "Arial, sans-serif",
                        }}
                      >
                        2.4 MB
                      </p>
                    </div>

                    {/* Checkmark */}
                    {frame >= 75 && (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "#10b981",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "24px", color: "white" }}>✓</span>
                      </div>
                    )}

                    {/* AI Scan line */}
                    {frame >= 85 && frame < 125 && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: `${(scanLineY % 100)}%`,
                          height: "2px",
                          background: "linear-gradient(90deg, transparent, #0077B5, transparent)",
                          boxShadow: "0 0 10px #0077B5",
                          opacity: aiScanOpacity,
                        }}
                      />
                    )}
                  </div>

                  {/* Progress bar */}
                  {frame >= 75 && frame < 125 && (
                    <div
                      style={{
                        marginTop: "20px",
                        opacity: progressOpacity,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#0077B5",
                            fontWeight: "600",
                            fontFamily: "Arial, sans-serif",
                          }}
                        >
                          AI Analyzing...
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#94a3b8",
                            fontFamily: "Arial, sans-serif",
                          }}
                        >
                          {Math.round(progressWidth)}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          background: "rgba(148, 163, 184, 0.2)",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progressWidth}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #0077B5, #00A0DC)",
                            borderRadius: "4px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results - Topics/Skills */}
        {frame >= 125 && (
          <div
            style={{
              width: "100%",
              transform: `translateY(${resultsY}px)`,
              opacity: resultsOpacity,
            }}
          >
            <h3
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "white",
                marginBottom: "24px",
                textAlign: "center",
                fontFamily: "Arial, sans-serif",
              }}
            >
              🎯 Your Content Topics
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              {topics.map((topic, index) => {
                const itemDelay = 130 + index * 8;
                const itemOpacity = interpolate(frame, [itemDelay, itemDelay + 8], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });

                const itemScale = spring({
                  frame: frame - itemDelay,
                  fps,
                  config: {
                    damping: 12,
                    stiffness: 100,
                  },
                });

                return (
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
                      opacity: itemOpacity,
                      transform: `scale(${itemScale})`,
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
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cursor - persistent across scenes */}
      {frame <= 75 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(${cursorX}px, ${cursorY}px) scale(${cursorScale})`,
            opacity: cursorOpacity,
            pointerEvents: "none",
            zIndex: 1000,
            transition: "transform 0.1s ease",
          }}
        >
          {/* Cursor arrow */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="white"
            style={{
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
            }}
          >
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </div>
      )}

      {/* Dragged file icon (follows cursor during drag) */}
      {isDragging && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(${cursorX}px, ${cursorY}px)`,
            opacity: draggedFileOpacity,
            pointerEvents: "none",
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: "60px",
              height: "75px",
              background: "linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(0, 119, 181, 0.5)",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              transform: "translate(-30px, -37.5px)", // Center the file on cursor
            }}
          >
            <span style={{ fontSize: "32px", color: "white" }}>📄</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
