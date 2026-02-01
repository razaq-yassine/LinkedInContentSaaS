import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Easing } from "remotion";
import { FaThumbsUp, FaComment, FaShare, FaPaperPlane } from "react-icons/fa";

interface Scene6GenerationProps {
  brandName: string;
}

export const Scene6Generation: React.FC<Scene6GenerationProps> = ({ brandName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo stays in same position
  const logoY = -380;
  const logoScale = 0.35;

  // Cursor starts visible from Scene 5 transition
  const cursorOpacity = interpolate(frame, [0, 90, 95], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor starts at bottom (where button was in Scene 5), then moves to textarea
  const cursorX = interpolate(
    frame,
    [5, 20],
    [0, -320],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorY = interpolate(
    frame,
    [5, 20],
    [220, -20],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  // Cursor click in textarea
  const cursorClick = interpolate(frame, [25, 27], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Textarea focus (border highlight)
  const textareaFocusOpacity = interpolate(frame, [25, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typewriter effect for user prompt
  const promptText = "Share insights about how AI is transforming product development in 2026";
  const promptCharsToShow = Math.floor(
    interpolate(frame, [30, 75], [0, promptText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Generate button appears
  const generateButtonY = spring({
    frame: frame - 80,
    fps,
    from: 30,
    to: 0,
    config: {
      damping: 15,
      stiffness: 100,
    },
  });

  const generateButtonOpacity = interpolate(frame, [80, 87], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor moves to generate button
  const cursorXToButton = interpolate(
    frame,
    [80, 95],
    [-320, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorYToButton = interpolate(
    frame,
    [80, 95],
    [-20, 140],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  // Button click
  const buttonClick = interpolate(frame, [100, 102], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Loading animation on button
  const loadingOpacity = interpolate(frame, [102, 107], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const loadingRotation = interpolate(frame, [102, 155], [0, 360 * 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "extend",
  });

  // Content transition - prompt area slides up and shrinks
  const promptContainerScale = interpolate(frame, [115, 135], [1, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const promptContainerY = interpolate(frame, [115, 135], [0, -200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const promptContainerOpacity = interpolate(frame, [115, 130], [1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Generated post appears
  const postOpacity = interpolate(frame, [135, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const postY = spring({
    frame: frame - 135,
    fps,
    from: 50,
    to: 0,
    config: {
      damping: 20,
      stiffness: 80,
    },
  });

  // Generated post content with typewriter effect
  const postContent = `AI is revolutionizing product development in 2026

After years of leading product teams, I've witnessed firsthand how AI has transformed our development lifecycle.

Key insights:
• 60% faster prototyping with AI-assisted design
• Real-time user feedback analysis
• Automated testing reduces bugs by 75%

The future isn't about replacing human creativity—it's about augmenting it.

What's your experience with AI in product development?

#AI #ProductDevelopment #Innovation`;

  const postCharsToShow = Math.floor(
    interpolate(frame, [150, 215], [0, postContent.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Use cursor position based on phase
  const finalCursorX = frame < 80 ? cursorX : cursorXToButton;
  const finalCursorY = frame < 80 ? cursorY : cursorYToButton;

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

      {/* Main content container */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${promptContainerY}px) scale(${promptContainerScale})`,
          width: "1000px",
          opacity: promptContainerOpacity,
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

        {/* Prompt textarea */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.8)",
            border: `2px solid ${frame >= 25 && textareaFocusOpacity > 0 ? `rgba(0, 119, 181, ${textareaFocusOpacity})` : "rgba(0, 119, 181, 0.3)"}`,
            borderRadius: "20px",
            padding: "32px",
            minHeight: "200px",
            boxShadow: frame >= 25 && textareaFocusOpacity > 0 ? `0 0 20px rgba(0, 119, 181, ${textareaFocusOpacity * 0.3})` : "none",
            transition: "all 0.3s ease",
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
              background: frame >= 25 ? "transparent" : "rgba(15, 23, 42, 0.5)",
              border: frame >= 25 ? "none" : "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: frame >= 25 ? "0" : "12px",
              padding: frame >= 25 ? "0" : "16px",
              fontSize: "18px",
              color: frame >= 30 ? "white" : "#94a3b8",
              fontFamily: "Arial, sans-serif",
              lineHeight: "1.6",
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            {frame >= 30 ? (
              <>
                {promptText.substring(0, promptCharsToShow)}
                {frame < 75 && promptCharsToShow < promptText.length && (
                  <span style={{ opacity: 0.5, animation: "blink 1s infinite" }}>|</span>
                )}
              </>
            ) : (
              <span style={{ opacity: 0.5 }}>Type your prompt here...</span>
            )}
          </div>
        </div>

        {/* Generate button */}
        {frame >= 80 && (
          <div
            style={{
              marginTop: "32px",
              display: "flex",
              justifyContent: "center",
              transform: `translateY(${generateButtonY}px)`,
              opacity: generateButtonOpacity,
            }}
          >
            <button
              style={{
                padding: "18px 48px",
                fontSize: "20px",
                fontWeight: "600",
                color: "white",
                background: frame >= 102 ? "#0088CC" : "#0077B5",
                border: "none",
                borderRadius: "16px",
                cursor: "pointer",
                fontFamily: "Arial, sans-serif",
                boxShadow: "0 8px 24px rgba(0, 119, 181, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transform: `scale(${frame >= 100 && frame < 115 ? buttonClick : 1})`,
              }}
            >
              {frame >= 102 ? (
                <>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "3px solid rgba(255, 255, 255, 0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      transform: `rotate(${loadingRotation}deg)`,
                      opacity: loadingOpacity,
                    }}
                  />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Generate Post</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Generated LinkedIn Post */}
      {frame >= 135 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translateY(${postY}px)`,
            width: "700px",
            opacity: postOpacity,
          }}
        >
          {/* LinkedIn Post Card */}
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Post Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0077B5, #00A0DC)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                JD
              </div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "16px", color: "#000000", fontFamily: "Arial, sans-serif" }}>
                  John Doe
                </div>
                <div style={{ fontSize: "14px", color: "#666666", fontFamily: "Arial, sans-serif" }}>
                  Product Manager | AI Enthusiast
                </div>
                <div style={{ fontSize: "12px", color: "#666666", fontFamily: "Arial, sans-serif" }}>
                  2m • 🌐
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div
              style={{
                fontSize: "15px",
                color: "#000000",
                lineHeight: "1.6",
                fontFamily: "Arial, sans-serif",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
              }}
            >
              {postContent.substring(0, postCharsToShow)}
              {frame < 215 && postCharsToShow < postContent.length && (
                <span style={{ opacity: 0.5 }}>|</span>
              )}
            </div>

            {/* Post Actions (if content is complete) */}
            {frame >= 215 && (
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e0e0e0",
                  display: "flex",
                  justifyContent: "space-around",
                }}
              >
                {/* Like */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666666", fontSize: "14px", fontWeight: "600", fontFamily: "Arial, sans-serif" }}>
                  <FaThumbsUp size={20} />
                  <span>Like</span>
                </div>

                {/* Comment */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666666", fontSize: "14px", fontWeight: "600", fontFamily: "Arial, sans-serif" }}>
                  <FaComment size={20} />
                  <span>Comment</span>
                </div>

                {/* Repost */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666666", fontSize: "14px", fontWeight: "600", fontFamily: "Arial, sans-serif" }}>
                  <FaShare size={20} />
                  <span>Repost</span>
                </div>

                {/* Send */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#666666", fontSize: "14px", fontWeight: "600", fontFamily: "Arial, sans-serif" }}>
                  <FaPaperPlane size={20} />
                  <span>Send</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cursor */}
      {cursorOpacity > 0 && frame < 100 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(${finalCursorX}px, ${finalCursorY}px) scale(${frame >= 25 && frame < 28 ? cursorClick : frame >= 100 ? buttonClick : 1})`,
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
