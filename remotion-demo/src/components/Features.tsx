import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Features: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const features = [
    {
      icon: "🤖",
      title: "AI Content Generation",
      description: "Generate engaging posts in seconds",
    },
    {
      icon: "📅",
      title: "Smart Scheduling",
      description: "Post at optimal times automatically",
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Track performance and insights",
    },
    {
      icon: "🎯",
      title: "Audience Targeting",
      description: "Reach the right people every time",
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px",
      }}
    >
      <div style={{ maxWidth: "1600px", width: "100%" }}>
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
          Powerful Features
        </h2>

        {/* Features Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
          }}
        >
          {features.map((feature, index) => {
            const featureDelay = 30 + index * 30;
            const featureOpacity = interpolate(frame, [featureDelay, featureDelay + 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const featureScale = interpolate(frame, [featureDelay, featureDelay + 20], [0.8, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={index}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "20px",
                  padding: "50px",
                  opacity: featureOpacity,
                  transform: `scale(${featureScale})`,
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "80px",
                    marginBottom: "20px",
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "42px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "15px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: "32px",
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: 0,
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
