import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Scene1HeroIntro } from "./scenes/Scene1HeroIntro";
import { Scene3LinkedInLogin } from "./scenes/Scene3LinkedInLogin";
import { Scene4Onboarding } from "./scenes/Scene4Onboarding";
import { Scene5Approval } from "./scenes/Scene5Approval";
import { Scene6Generation } from "./scenes/Scene6Generation";
import { Scene7Publish } from "./scenes/Scene7Publish";
import { Scene8Engagement } from "./scenes/Scene8Engagement";

export interface SaaSDemoProps {
  brandName: string;
  tagline: string;
}

export const SaaSDemo: React.FC<SaaSDemoProps> = ({ brandName, tagline }) => {
  const frame = useCurrentFrame();
  
  // Background music volume with fade out in last second (frames 1400-1430)
  const musicVolume = interpolate(
    frame,
    [0, 1400, 1430],
    [0.3, 0.3, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0F172A" }}>
      {/* Background Music with Fade Out */}
      <Audio
        src={staticFile("background-music.mp3")}
        volume={musicVolume}
        startFrom={0}
        endAt={1430}
      />

      {/* Scene 1: Hero Intro - 0-135 frames (4.5 seconds) */}
      <Sequence from={0} durationInFrames={135}>
        <Scene1HeroIntro brandName={brandName} tagline={tagline} />
      </Sequence>

      {/* Scene 3: LinkedIn Login - 135-315 frames (6 seconds) */}
      <Sequence from={135} durationInFrames={180}>
        <Scene3LinkedInLogin brandName={brandName} />
      </Sequence>

      {/* Scene 4: Onboarding/CV Upload - 315-580 frames (8.83 seconds) */}
      <Sequence from={315} durationInFrames={265}>
        <Scene4Onboarding brandName={brandName} />
      </Sequence>

      {/* Scene 5: Approval & Transition - 580-735 frames (5.17 seconds) */}
      <Sequence from={580} durationInFrames={155}>
        <Scene5Approval brandName={brandName} />
      </Sequence>

      {/* Scene 6: Generation & Post Preview - 735-1050 frames (10.5 seconds) */}
      <Sequence from={735} durationInFrames={315}>
        <Scene6Generation brandName={brandName} />
      </Sequence>

      {/* Scene 7: Publish & Success - 1050-1205 frames (5.17 seconds) */}
      <Sequence from={1050} durationInFrames={155}>
        <Scene7Publish brandName={brandName} />
      </Sequence>

      {/* Scene 8: Engagement & Reactions - 1205-1430 frames (7.5 seconds) */}
      <Sequence from={1205} durationInFrames={225}>
        <Scene8Engagement brandName={brandName} />
      </Sequence>

      {/* ===== VOICEOVERS ===== */}
      
      {/* Scene 1: Voiceover */}
      <Sequence from={0} durationInFrames={135}>
        <Audio src={staticFile("voiceover-scene1.mp3")} volume={1.0} />
      </Sequence>

      {/* Scene 3: Voiceover */}
      <Sequence from={135} durationInFrames={180}>
        <Audio src={staticFile("voiceover-scene3.mp3")} volume={1.0} />
      </Sequence>

      {/* Scene 4: Voiceover */}
      <Sequence from={315} durationInFrames={265}>
        <Audio src={staticFile("voiceover-scene4.mp3")} volume={1.0} />
      </Sequence>

      {/* Scene 5: Voiceover */}
      <Sequence from={580} durationInFrames={155}>
        <Audio src={staticFile("voiceover-scene5.mp3")} volume={1.0} />
      </Sequence>

      {/* Scene 6: Voiceover */}
      <Sequence from={735} durationInFrames={315}>
        <Audio src={staticFile("voiceover-scene6.mp3")} volume={1.0} />
      </Sequence>

      {/* Scene 7: Voiceover */}
      <Sequence from={1050} durationInFrames={155}>
        <Audio src={staticFile("voiceover-scene7.mp3")} volume={1.0} />
      </Sequence>

      {/* Scene 8: Voiceover */}
      <Sequence from={1205} durationInFrames={225}>
        <Audio src={staticFile("voiceover-scene8.mp3")} volume={1.0} />
      </Sequence>

      {/* ===== SOUND EFFECTS ===== */}
      
      {/* Scene Transition Whooshes */}
      <Sequence from={135} durationInFrames={30}>
        <Audio src={staticFile("whoosh-transition.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={315} durationInFrames={30}>
        <Audio src={staticFile("whoosh-transition.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={580} durationInFrames={30}>
        <Audio src={staticFile("whoosh-transition.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={735} durationInFrames={30}>
        <Audio src={staticFile("whoosh-transition.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={1050} durationInFrames={30}>
        <Audio src={staticFile("whoosh-transition.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={1205} durationInFrames={30}>
        <Audio src={staticFile("whoosh-transition.mp3")} volume={0.6} />
      </Sequence>

      {/* Scene 3: LinkedIn Login - Sounds */}
      {/* Bubble pop - Form stacking */}
      <Sequence from={200} durationInFrames={15}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.5} />
      </Sequence>
      {/* Cursor click - LinkedIn button */}
      <Sequence from={265} durationInFrames={50}>
        <Audio src={staticFile("cursor-click.mp3")} volume={0.8} />
      </Sequence>

      {/* Scene 4: Onboarding - Sounds */}
      {/* File drop - Using whoosh sound */}
      <Sequence from={365} durationInFrames={30}>
        <Audio src={staticFile("file-drop.mp3")} volume={0.6} />
      </Sequence>
      {/* AI Processing */}
      <Sequence from={390} durationInFrames={45}>
        <Audio src={staticFile("ai-processing.mp3")} volume={0.5} />
      </Sequence>
      {/* Pop sounds - Topic cards appearing */}
      <Sequence from={445} durationInFrames={10}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={452} durationInFrames={10}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={459} durationInFrames={10}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={466} durationInFrames={10}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={473} durationInFrames={10}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.4} />
      </Sequence>

      {/* Scene 5: Approval - Sounds */}
      {/* Cursor click - Approve button */}
      <Sequence from={635} durationInFrames={50}>
        <Audio src={staticFile("cursor-click.mp3")} volume={0.8} />
      </Sequence>

      {/* Scene 6: Generation - Sounds */}
      {/* Cursor click - Textarea */}
      <Sequence from={760} durationInFrames={50}>
        <Audio src={staticFile("cursor-click.mp3")} volume={0.8} />
      </Sequence>
      {/* Keyboard typing - User typing prompt */}
      <Sequence from={765} durationInFrames={45}>
        <Audio src={staticFile("keyboard-type.mp3")} volume={0.8} />
      </Sequence>
      {/* Cursor click - Generate button */}
      <Sequence from={835} durationInFrames={50}>
        <Audio src={staticFile("cursor-click.mp3")} volume={0.8} />
      </Sequence>
      {/* AI Processing - Generating post */}
      <Sequence from={837} durationInFrames={33}>
        <Audio src={staticFile("ai-processing.mp3")} volume={0.5} />
      </Sequence>
      {/* Keyboard typing - Content being generated */}
      <Sequence from={837} durationInFrames={33}>
        <Audio src={staticFile("keyboard-type.mp3")} volume={0.6} />
      </Sequence>

      {/* Scene 7: Publish - Sounds */}
      {/* Cursor click - Publish button */}
      <Sequence from={1110} durationInFrames={50}>
        <Audio src={staticFile("cursor-click.mp3")} volume={0.8} />
      </Sequence>
      {/* Success chime */}
      <Sequence from={1125} durationInFrames={40}>
        <Audio src={staticFile("success-chime.mp3")} volume={0.7} />
      </Sequence>
      {/* Confetti pop */}
      <Sequence from={1125} durationInFrames={30}>
        <Audio src={staticFile("confetti-pop.mp3")} volume={0.5} />
      </Sequence>

      {/* Scene 8: Engagement - Sounds */}
      {/* Notification pings - Reactions appearing */}
      <Sequence from={1285} durationInFrames={15}>
        <Audio src={staticFile("notification-ping.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={1295} durationInFrames={15}>
        <Audio src={staticFile("notification-ping.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={1305} durationInFrames={15}>
        <Audio src={staticFile("notification-ping.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={1315} durationInFrames={15}>
        <Audio src={staticFile("notification-ping.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={1325} durationInFrames={15}>
        <Audio src={staticFile("notification-ping.mp3")} volume={0.5} />
      </Sequence>
      
      {/* Pop sounds - Comments appearing */}
      <Sequence from={1340} durationInFrames={15}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={1360} durationInFrames={15}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={1380} durationInFrames={15}>
        <Audio src={staticFile("pop-bubble.mp3")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
