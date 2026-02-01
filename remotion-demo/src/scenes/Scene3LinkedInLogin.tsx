import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, staticFile, Easing } from "remotion";

interface Scene3LinkedInLoginProps {
  brandName: string;
}

export const Scene3LinkedInLogin: React.FC<Scene3LinkedInLoginProps> = ({ brandName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const welcomeText = "Welcome back";
  const subtitleText = "Sign in to continue creating AI-powered content";

  // Logo transition - moves to top center and shrinks (FASTER)
  const logoY = interpolate(
    frame,
    [0, 20],
    [0, -380],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }
  );

  const logoScale = interpolate(
    frame,
    [0, 20],
    [1, 0.35],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }
  );

  // Welcome text - typewriter effect
  const welcomeCharsToShow = Math.floor(
    interpolate(frame, [25, 40], [0, welcomeText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const welcomeOpacity = interpolate(frame, [25, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle text - typewriter effect
  const subtitleCharsToShow = Math.floor(
    interpolate(frame, [42, 62], [0, subtitleText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const subtitleOpacity = interpolate(frame, [42, 47], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // LinkedIn button - drops in from top (SLOWER)
  const linkedInButtonY = spring({
    frame: frame - 65,
    fps,
    from: -100,
    to: 0,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  const linkedInButtonOpacity = interpolate(frame, [65, 72], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Google button - drops in after LinkedIn (SLOWER)
  const googleButtonY = spring({
    frame: frame - 78,
    fps,
    from: -100,
    to: 0,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  const googleButtonOpacity = interpolate(frame, [78, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Divider fade in (SLOWER)
  const dividerOpacity = interpolate(frame, [90, 97], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Email fields - slide up (SLOWER)
  const emailFieldsY = spring({
    frame: frame - 100,
    fps,
    from: 50,
    to: 0,
    config: {
      damping: 15,
      stiffness: 80,
    },
  });

  const emailFieldsOpacity = interpolate(frame, [100, 107], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // LinkedIn button glow (before cursor)
  const linkedInButtonGlow = interpolate(
    frame,
    [110, 115, 120],
    [0, 1, 0.6],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Cursor animation - moves to LinkedIn button (positioned to click center of button)
  const cursorX = interpolate(
    frame,
    [110, 123],
    [-400, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorY = interpolate(
    frame,
    [110, 123],
    [-200, -80],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const cursorOpacity = interpolate(
    frame,
    [110, 115, 175, 180],
    [0, 1, 1, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const cursorClick = interpolate(
    frame,
    [130, 132],
    [1, 0.85],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Success checkmark (with delay after click, stays longer)
  const checkmarkScale = spring({
    frame: frame - 143,
    fps,
    config: {
      damping: 8,
      stiffness: 100,
    },
  });

  const checkmarkOpacity = interpolate(
    frame,
    [143, 148, 170, 180],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Confetti particles
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    angle: (i * 360) / 30,
    distance: 150 + (i % 3) * 50,
    size: 8 + (i % 3) * 4,
    color: ['#0077B5', '#00A0DC', '#0088CC', '#FFD700', '#10b981'][i % 5],
  }));

  return (
    <AbsoluteFill>
      {/* Background - transitions from blue gradient to dark */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        }}
      />

      {/* Transitioning Logo */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${logoY}px) scale(${logoScale})`,
          zIndex: 100,
        }}
      >
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

      {/* Login Form - Centered with Fixed Layout */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          paddingTop: "80px",
        }}
      >
        {/* Welcome Text - Typewriter */}
        <div style={{ textAlign: "center", opacity: frame >= 25 ? welcomeOpacity : 0, height: "58px", marginBottom: "8px" }}>
          <h2
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "white",
              margin: 0,
              fontFamily: "Arial, sans-serif",
            }}
          >
            {frame >= 25 ? welcomeText.substring(0, welcomeCharsToShow) : ""}
            {frame >= 25 && frame < 40 && welcomeCharsToShow < welcomeText.length && (
              <span style={{ opacity: 0.5 }}>|</span>
            )}
          </h2>
        </div>

        {/* Subtitle - Typewriter */}
        <div style={{ textAlign: "center", opacity: frame >= 42 ? subtitleOpacity : 0, height: "28px", marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "18px",
              color: "#94a3b8",
              margin: 0,
              fontFamily: "Arial, sans-serif",
            }}
          >
            {frame >= 42 ? subtitleText.substring(0, subtitleCharsToShow) : ""}
            {frame >= 42 && frame < 62 && subtitleCharsToShow < subtitleText.length && (
              <span style={{ opacity: 0.5 }}>|</span>
            )}
          </p>
        </div>

        {/* LinkedIn Button - Drops in */}
        <div style={{ position: "relative", height: "64px", marginBottom: "16px" }}>
          {/* Glow effect */}
          {frame >= 65 && (
            <div
              style={{
                position: "absolute",
                inset: "-6px",
                background: "rgba(0, 119, 181, 0.5)",
                borderRadius: "18px",
                filter: "blur(20px)",
                opacity: linkedInButtonGlow,
              }}
            />
          )}

          <button
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "20px 32px",
              border: "2px solid #0077B5",
              background: frame >= 132 ? "#0077B5" : "transparent",
              color: frame >= 132 ? "white" : "#0077B5",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "600",
              fontFamily: "Arial, sans-serif",
              cursor: "pointer",
              position: "relative",
              transform: `translateY(${frame >= 65 ? linkedInButtonY : -100}px)`,
              opacity: frame >= 65 ? linkedInButtonOpacity : 0,
              transition: "all 0.3s ease",
            }}
          >
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Continue with LinkedIn
          </button>
        </div>

        {/* Google Button - Drops in */}
        <div style={{ height: "64px", marginBottom: "16px" }}>
          <button
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "20px 32px",
              border: "2px solid rgba(148, 163, 184, 0.3)",
              background: "transparent",
              color: "#e2e8f0",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "600",
              fontFamily: "Arial, sans-serif",
              cursor: "pointer",
              transform: `translateY(${frame >= 78 ? googleButtonY : -100}px)`,
              opacity: frame >= 78 ? googleButtonOpacity : 0,
              transition: "all 0.3s ease",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            margin: "8px 0",
            height: "20px",
            marginBottom: "16px",
            opacity: frame >= 90 ? dividerOpacity : 0,
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "rgba(148, 163, 184, 0.2)" }} />
          <span
            style={{
              padding: "0 16px",
              fontSize: "14px",
              color: "#64748b",
              fontFamily: "Arial, sans-serif",
            }}
          >
            or continue with email
          </span>
          <div style={{ flex: 1, height: "1px", background: "rgba(148, 163, 184, 0.2)" }} />
        </div>

        {/* Email Fields */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            transform: `translateY(${frame >= 100 ? emailFieldsY : 50}px)`,
            opacity: frame >= 100 ? emailFieldsOpacity : 0,
          }}
        >
          {/* Email Input */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                color: "#cbd5e1",
                marginBottom: "8px",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Email
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "rgba(15, 23, 42, 0.5)",
                color: "white",
                borderRadius: "12px",
                fontSize: "16px",
                fontFamily: "Arial, sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                color: "#cbd5e1",
                marginBottom: "8px",
                fontFamily: "Arial, sans-serif",
              }}
            >
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "rgba(15, 23, 42, 0.5)",
                color: "white",
                borderRadius: "12px",
                fontSize: "16px",
                fontFamily: "Arial, sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Sign In Button */}
          <button
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              background: "#0077B5",
              color: "white",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "600",
              fontFamily: "Arial, sans-serif",
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            Sign in
          </button>
        </div>

        {/* Cursor */}
        {frame >= 110 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${cursorX}px), calc(-50% + ${cursorY}px)) scale(${cursorClick})`,
              opacity: cursorOpacity,
              pointerEvents: "none",
              zIndex: 1000,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="black" strokeWidth="1">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
          </div>
        )}

        {/* Success Checkmark */}
        {frame >= 143 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              opacity: checkmarkOpacity,
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "#10b981",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${checkmarkScale})`,
                boxShadow: "0 20px 60px rgba(16, 185, 129, 0.4)",
              }}
            >
              <span style={{ fontSize: "48px", color: "white" }}>✓</span>
            </div>
            <span
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#10b981",
                fontFamily: "Arial, sans-serif",
                textShadow: "0 2px 10px rgba(16, 185, 129, 0.3)",
              }}
            >
              Connected!
            </span>
          </div>
        )}

        {/* Confetti */}
        {frame >= 143 &&
          confettiParticles.map((particle) => {
            const particleDistance = interpolate(
              frame,
              [143, 165],
              [0, particle.distance],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.quad),
              }
            );

            const particleOpacity = interpolate(
              frame,
              [143, 148, 170, 180],
              [0, 1, 1, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }
            );

            const particleRotation = (frame - 143) * 12;
            const radians = (particle.angle * Math.PI) / 180;
            const x = Math.cos(radians) * particleDistance;
            const y = Math.sin(radians) * particleDistance;

            return (
              <div
                key={particle.id}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  background: particle.color,
                  borderRadius: "2px",
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${particleRotation}deg)`,
                  opacity: particleOpacity,
                  pointerEvents: "none",
                }}
              />
            );
          })}
      </div>
    </AbsoluteFill>
  );
};
