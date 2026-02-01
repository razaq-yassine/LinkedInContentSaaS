import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile } from "remotion";

interface Scene1HeroIntroProps {
  brandName: string;
  tagline: string;
}

export const Scene1HeroIntro: React.FC<Scene1HeroIntroProps> = ({ brandName, tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo animation - flies in from top with bounce
  const logoY = spring({
    frame,
    fps,
    from: -200,
    to: 0,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.5,
    },
  });

  // Logo scale animation with overshoot (EVEN FASTER)
  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 8,
      stiffness: 120,
    },
  });

  // Tagline animation - fade in and slide up (EVEN FASTER)
  const taglineOpacity = interpolate(frame, [18, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [18, 35], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Lens flare effect when logo lands (EVEN FASTER)
  const lensFlareOpacity = interpolate(
    frame,
    [12, 16, 20],
    [0, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const lensFlareScale = interpolate(
    frame,
    [12, 16, 20],
    [0.5, 2, 3],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );


  // Generate floating LinkedIn icon particles
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: (i * 73) % 120 - 10, // Spread across width
    y: (i * 47) % 120 - 10, // Spread across height
    size: 20 + (i % 3) * 15,
    rotation: i * 15,
    delay: i * 2,
    speed: 0.3 + (i % 5) * 0.1,
  }));

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        overflow: "hidden",
      }}
    >
      {/* Floating Particle Background */}
      {particles.map((particle) => {
        const particleOpacity = interpolate(
          frame,
          [particle.delay, particle.delay + 30],
          [0, 0.15],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );

        const particleRotation = (frame - particle.delay) * particle.speed;
        const particleY = interpolate(
          frame,
          [particle.delay, particle.delay + 150],
          [0, -20],
          {
            extrapolateRight: "extend",
          }
        );

        return (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particleOpacity,
              transform: `translateY(${particleY}px) rotate(${particleRotation}deg)`,
              filter: "blur(1.5px)",
            }}
          >
            {/* Use actual logo as particles */}
            <img
              src={staticFile("logo-sm.png")}
              alt="Logo particle"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: 0.8,
              }}
            />
          </div>
        );
      })}

      {/* Main Content Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo with animations */}
        <div
          style={{
            transform: `translateY(${logoY}px) scale(${logoScale})`,
            position: "relative",
          }}
        >
          {/* Lens Flare Effect */}
          {frame > 12 && frame < 20 && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)",
                transform: `translate(-50%, -50%) scale(${lensFlareScale})`,
                opacity: lensFlareOpacity,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Logo Image */}
          <img
            src={staticFile("logo-dark.png")}
            alt={brandName}
            style={{
              height: "180px",
              width: "auto",
              display: "block",
              filter: "drop-shadow(0 0 60px rgba(255, 255, 255, 0.8)) drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))",
            }}
          />
        </div>

        {/* Tagline */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            marginTop: "60px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              padding: "20px 50px",
              borderRadius: "50px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <p
              style={{
                fontSize: "48px",
                color: "white",
                margin: 0,
                fontFamily: "Arial, sans-serif",
                fontWeight: "400",
                textShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
              }}
            >
              {tagline}
            </p>
          </div>
        </div>

        {/* Decorative elements - animated circles (EVEN FASTER) */}
        {[...Array(3)].map((_, i) => {
          const circleScale = spring({
            frame: frame - i * 4,
            fps,
            config: {
              damping: 12,
            },
          });

          const circleOpacity = interpolate(
            frame,
            [i * 4, i * 4 + 10, 45 + i * 4],
            [0, 0.3, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          );

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: `${400 + i * 150}px`,
                height: `${400 + i * 150}px`,
                borderRadius: "50%",
                border: "3px solid rgba(255, 255, 255, 0.3)",
                transform: `translate(-50%, -50%) scale(${circleScale})`,
                opacity: circleOpacity,
                pointerEvents: "none",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
