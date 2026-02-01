import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Easing } from "remotion";
import { FaThumbsUp, FaComment, FaShare, FaPaperPlane } from "react-icons/fa";

interface Scene8EngagementProps {
  brandName: string;
}

export const Scene8Engagement: React.FC<Scene8EngagementProps> = ({ brandName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo stays in same position
  const logoY = -380;
  const logoScale = 0.35;

  // Post content (same as Scene 6 & 7)
  const postContent = `AI is revolutionizing product development in 2026

After years of leading product teams, I've witnessed firsthand how AI has transformed our development lifecycle.

Key insights:
• 60% faster prototyping with AI-assisted design
• Real-time user feedback analysis
• Automated testing reduces bugs by 75%

The future isn't about replacing human creativity—it's about augmenting it.

What's your experience with AI in product development?

#AI #ProductDevelopment #Innovation`;

  // CTA appears first, then fades out
  const ctaOpacityEarly = interpolate(frame, [0, 15, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaScaleEarly = spring({
    frame: frame,
    fps,
    from: 0.9,
    to: 1,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  const ctaYEarly = spring({
    frame: frame,
    fps,
    from: 50,
    to: 0,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  // Post fades in after CTA
  const postOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Engagement reactions data - adjusted timing
  const reactions = [
    { type: "like", icon: "👍", count: 127, delay: 80, color: "#0077B5" },
    { type: "celebrate", icon: "🎉", count: 43, delay: 90, color: "#FFD700" },
    { type: "support", icon: "💪", count: 28, delay: 100, color: "#10b981" },
    { type: "love", icon: "❤️", count: 19, delay: 110, color: "#ef4444" },
    { type: "insightful", icon: "💡", count: 12, delay: 120, color: "#8b5cf6" },
  ];

  // Reaction animations - jumping effect
  const getReactionAnimation = (delay: number) => {
    const reactionFrame = frame - delay;
    const jumpY = spring({
      frame: reactionFrame,
      fps,
      from: 30,
      to: 0,
      config: {
        damping: 8,
        stiffness: 150,
      },
    });

    const scale = spring({
      frame: reactionFrame,
      fps,
      from: 0.5,
      to: 1,
      config: {
        damping: 10,
        stiffness: 200,
      },
    });

    const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Continuous subtle bounce
    const bounceY = Math.sin((frame - delay) * 0.3) * 3;

    return { jumpY, scale, opacity, bounceY };
  };

  // Number increment animation
  const getNumberValue = (target: number, delay: number) => {
    const startFrame = delay + 10;
    const duration = 30;
    const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.ease),
    });
    return Math.floor(target * progress);
  };

  // Total engagement count
  const totalEngagements = reactions.reduce((sum, r) => sum + r.count, 0);
  const totalCount = getNumberValue(totalEngagements, 15);

  // Comments appear - adjusted timing with longer delays
  const comments = [
    { name: "Sarah Chen", text: "Great insights! We've seen similar results in our team.", delay: 135, avatar: "SC" },
    { name: "Michael Rodriguez", text: "The AI-assisted design has been a game changer for us.", delay: 155, avatar: "MR" },
    { name: "Emily Johnson", text: "Love this perspective! Thanks for sharing.", delay: 175, avatar: "EJ" },
  ];

  const getCommentAnimation = (delay: number) => {
    const commentY = spring({
      frame: frame - delay,
      fps,
      from: 30,
      to: 0,
      config: {
        damping: 15,
        stiffness: 100,
      },
    });

    const commentOpacity = interpolate(frame, [delay, delay + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return { commentY, commentOpacity };
  };


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

      {/* LinkedIn Post with Engagement */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
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
                2h • 🌐
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
              marginBottom: "16px",
            }}
          >
            {postContent}
          </div>

          {/* Engagement Stats */}
          {frame >= 15 && (
            <div
              style={{
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              {/* Total Engagement Count */}
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#666666",
                  marginBottom: "12px",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {totalCount.toLocaleString()} reactions • {comments.filter(c => frame >= c.delay).length} comments
              </div>

              {/* Reaction Icons */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                {reactions.map((reaction, index) => {
                  const anim = getReactionAnimation(reaction.delay);
                  const count = getNumberValue(reaction.count, reaction.delay);

                  if (frame < reaction.delay) return null;

                  return (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(0, 119, 181, 0.1)",
                        padding: "4px 10px",
                        borderRadius: "16px",
                        transform: `translateY(${anim.jumpY + anim.bounceY}px) scale(${anim.scale})`,
                        opacity: anim.opacity,
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{reaction.icon}</span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#000000",
                          fontFamily: "Arial, sans-serif",
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Post Actions */}
          <div
            style={{
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

          {/* Comments Section */}
          {frame >= 70 && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e0e0e0" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#666666",
                  marginBottom: "12px",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                Comments
              </div>

              {comments.map((comment, index) => {
                const anim = getCommentAnimation(comment.delay);
                if (frame < comment.delay) return null;

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "16px",
                      transform: `translateY(${anim.commentY}px)`,
                      opacity: anim.commentOpacity,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${['#0077B5', '#10b981', '#8b5cf6'][index]}, ${['#00A0DC', '#059669', '#a78bfa'][index]})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        color: "white",
                        fontWeight: "bold",
                        flexShrink: 0,
                      }}
                    >
                      {comment.avatar}
                    </div>

                    {/* Comment Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600", fontSize: "14px", color: "#000000", marginBottom: "4px", fontFamily: "Arial, sans-serif" }}>
                        {comment.name}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", fontFamily: "Arial, sans-serif" }}>
                        {comment.text}
                      </div>
                      <div style={{ fontSize: "12px", color: "#999999", marginTop: "4px", fontFamily: "Arial, sans-serif" }}>
                        Like • Reply • 2h
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Call to Action - Watch your profile grow - Shows First */}
      {frame < 60 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translateY(${ctaYEarly}px) scale(${ctaScaleEarly})`,
            opacity: ctaOpacityEarly,
            textAlign: "center",
            zIndex: 100,
            width: "100%",
            padding: "0 40px",
          }}
        >
          <h2
            style={{
              fontSize: "64px",
              fontWeight: "bold",
              color: "white",
              margin: 0,
              marginBottom: "16px",
              fontFamily: "Arial, sans-serif",
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.8)",
            }}
          >
            Watch Your Profile Grow
          </h2>
          <p
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              margin: 0,
              fontFamily: "Arial, sans-serif",
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
            }}
          >
            Create engaging content that drives real engagement
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};
