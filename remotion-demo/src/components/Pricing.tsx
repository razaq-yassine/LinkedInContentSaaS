import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const Pricing: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const plans = [
    {
      name: "Starter",
      price: "$29",
      features: ["10 AI posts/month", "Basic analytics", "Email support"],
    },
    {
      name: "Pro",
      price: "$79",
      features: ["Unlimited AI posts", "Advanced analytics", "Priority support", "Team collaboration"],
      highlight: true,
    },
    {
      name: "Agency",
      price: "$199",
      features: ["Everything in Pro", "White-label", "API access", "Dedicated manager"],
    },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
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
          Simple Pricing
        </h2>

        {/* Pricing Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "40px",
          }}
        >
          {plans.map((plan, index) => {
            const planDelay = 30 + index * 20;
            const planOpacity = interpolate(frame, [planDelay, planDelay + 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const planY = interpolate(frame, [planDelay, planDelay + 20], [50, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={index}
                style={{
                  backgroundColor: plan.highlight ? "#6366f1" : "rgba(255, 255, 255, 0.05)",
                  borderRadius: "20px",
                  padding: "40px",
                  opacity: planOpacity,
                  transform: `translateY(${planY}px) scale(${plan.highlight ? 1.05 : 1})`,
                  border: plan.highlight ? "3px solid #8b5cf6" : "2px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <h3
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "20px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {plan.name}
                </h3>
                <div
                  style={{
                    fontSize: "56px",
                    fontWeight: "bold",
                    color: "white",
                    marginBottom: "30px",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {plan.price}
                  <span style={{ fontSize: "28px", fontWeight: "normal" }}>/mo</span>
                </div>
                <div>
                  {plan.features.map((feature, fIndex) => (
                    <div
                      key={fIndex}
                      style={{
                        fontSize: "24px",
                        color: "rgba(255, 255, 255, 0.9)",
                        marginBottom: "15px",
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      ✓ {feature}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
