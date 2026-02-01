import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Easing } from "remotion";
import { FaThumbsUp, FaComment, FaShare, FaPaperPlane, FaCalendar } from "react-icons/fa";

interface Scene7PublishProps {
  brandName: string;
}

export const Scene7Publish: React.FC<Scene7PublishProps> = ({ brandName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo stays in same position
  const logoY = -380;
  const logoScale = 0.35;

  // Post content (same as Scene 6)
  const postContent = `AI is revolutionizing product development in 2026

After years of leading product teams, I've witnessed firsthand how AI has transformed our development lifecycle.

Key insights:
• 60% faster prototyping with AI-assisted design
• Real-time user feedback analysis
• Automated testing reduces bugs by 75%

The future isn't about replacing human creativity—it's about augmenting it.

What's your experience with AI in product development?

#AI #ProductDevelopment #Innovation`;

  // Post scales down and moves up
  const postScale = interpolate(frame, [0, 25], [1, 0.75], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const postY = interpolate(frame, [0, 25], [0, -150], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Action buttons appear
  const buttonsY = spring({
    frame: frame - 25,
    fps,
    from: 50,
    to: 0,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  const buttonsOpacity = interpolate(frame, [25, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor appears and moves to Publish button
  const cursorOpacity = interpolate(frame, [30, 35, 85, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cursorX = interpolate(
    frame,
    [35, 50],
    [200, 100],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorY = interpolate(
    frame,
    [35, 50],
    [0, 220],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  // Cursor click on Publish button
  const cursorClick = interpolate(frame, [60, 62], [1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Publish button glow before click
  const publishGlow = interpolate(
    frame,
    [45, 50, 55],
    [0, 1, 0.6],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Publish button loading state
  const publishLoading = frame >= 62 && frame < 75;
  const loadingRotation = interpolate(frame, [62, 100], [0, 360 * 2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "extend",
  });

  // Success message fades out, but post stays visible for smooth transition
  const successFadeOut = interpolate(frame, [110, 120], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Success animation
  const successScale = spring({
    frame: frame - 75,
    fps,
    config: {
      damping: 10,
      stiffness: 100,
    },
  });

  const successOpacity = interpolate(frame, [75, 82, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) * successFadeOut;

  // LinkedIn reaction emoji confetti
  const reactionEmojis = ['👍', '❤️', '🎉', '💪', '💡', '🚀'];
  const confettiParticles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    angle: (i * 360) / 40,
    distance: 150 + (i % 4) * 60,
    emoji: reactionEmojis[i % reactionEmojis.length],
    size: 32 + (i % 3) * 8,
  }));

  const particleDistance = spring({
    frame: frame - 75,
    fps,
    from: 0,
    to: 1,
    config: {
      damping: 20,
      stiffness: 50,
    },
  });

  const particleOpacity = interpolate(frame, [75, 80, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) * successFadeOut;

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

      {/* LinkedIn Post Preview */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${postY}px) scale(${postScale})`,
          width: "700px",
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
                Just now • 🌐
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
            {postContent}
          </div>

          {/* Post Actions */}
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
        </div>
      </div>

      {/* Action Buttons */}
      {frame >= 25 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translateY(${220 + buttonsY}px)`,
            opacity: buttonsOpacity,
            display: "flex",
            gap: "20px",
          }}
        >
          {/* Schedule Button */}
          <button
            style={{
              padding: "16px 40px",
              fontSize: "18px",
              fontWeight: "600",
              color: "#0077B5",
              background: "transparent",
              border: "2px solid #0077B5",
              borderRadius: "12px",
              cursor: "pointer",
              fontFamily: "Arial, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaCalendar size={20} />
            <span>Schedule</span>
          </button>

          {/* Publish Button */}
          <div style={{ position: "relative" }}>
            {/* Button glow */}
            {frame >= 45 && publishGlow > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: "-8px",
                  background: `rgba(0, 119, 181, ${publishGlow * 0.3})`,
                  borderRadius: "20px",
                  filter: "blur(20px)",
                }}
              />
            )}

            <button
              style={{
                position: "relative",
                padding: "16px 40px",
                fontSize: "18px",
                fontWeight: "600",
                color: "white",
                background: publishLoading ? "#0088CC" : "#0077B5",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                fontFamily: "Arial, sans-serif",
                boxShadow: "0 8px 24px rgba(0, 119, 181, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transform: `scale(${frame >= 60 && frame < 65 ? cursorClick : 1})`,
              }}
            >
              {publishLoading ? (
                <>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "3px solid rgba(255, 255, 255, 0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      transform: `rotate(${loadingRotation}deg)`,
                    }}
                  />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <FaShare size={20} />
                  <span>Publish Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {frame >= 75 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${successScale})`,
            opacity: successOpacity,
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "48px 64px",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* Success Icon */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            {/* Success Text */}
            <div style={{ textAlign: "center" }}>
              <h3
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#000000",
                  margin: "0 0 8px 0",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                Post Published!
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  color: "#666666",
                  margin: 0,
                  fontFamily: "Arial, sans-serif",
                }}
              >
                Your content is now live on LinkedIn
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Reaction Emoji Confetti */}
      {frame >= 75 && frame < 120 &&
        confettiParticles.map((particle) => {
          const x = Math.cos((particle.angle * Math.PI) / 180) * particle.distance * particleDistance;
          const y = Math.sin((particle.angle * Math.PI) / 180) * particle.distance * particleDistance;
          const rotation = particleDistance * 360 * 2;

          return (
            <div
              key={particle.id}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                fontSize: `${particle.size}px`,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotation}deg)`,
                opacity: particleOpacity,
                pointerEvents: "none",
              }}
            >
              {particle.emoji}
            </div>
          );
        })}

      {/* Cursor */}
      {cursorOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(${cursorX}px, ${cursorY}px) scale(${frame >= 60 && frame < 63 ? cursorClick : 1})`,
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
