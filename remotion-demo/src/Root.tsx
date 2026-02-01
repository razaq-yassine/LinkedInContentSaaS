import React from "react";
import { Composition } from "remotion";
import { SaaSDemo } from "./SaaSDemo";
import { Scene1HeroIntro } from "./scenes/Scene1HeroIntro";
import { Scene3LinkedInLogin } from "./scenes/Scene3LinkedInLogin";
import { Scene4Onboarding } from "./scenes/Scene4Onboarding";
import { Scene5Approval } from "./scenes/Scene5Approval";
import { Scene6Generation } from "./scenes/Scene6Generation";
import { Scene7Publish } from "./scenes/Scene7Publish";
import { Scene8Engagement } from "./scenes/Scene8Engagement";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="SaaSDemo"
        component={SaaSDemo}
        durationInFrames={1430}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          brandName: "PotInAi",
          tagline: "AI-Powered LinkedIn Content Creation",
        }}
      />
      <Composition
        id="Scene1HeroIntro"
        component={Scene1HeroIntro}
        durationInFrames={135}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          brandName: "PotInAi",
          tagline: "AI-Powered LinkedIn Content Creation",
        }}
      />
      <Composition
        id="Scene3LinkedInLogin"
        component={Scene3LinkedInLogin}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          brandName: "PotInAi",
        }}
      />
      <Composition
        id="Scene4Onboarding"
        component={Scene4Onboarding}
        durationInFrames={265}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          brandName: "PotInAi",
        }}
      />
      <Composition
        id="Scene5Approval"
        component={Scene5Approval}
        durationInFrames={155}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          brandName: "PotInAi",
        }}
      />
      <Composition
        id="Scene6Generation"
        component={Scene6Generation}
        durationInFrames={315}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          brandName: "PotInAi",
        }}
      />
      <Composition
        id="Scene7Publish"
        component={Scene7Publish}
        durationInFrames={155}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          brandName: "PotInAi",
        }}
      />
      <Composition
        id="Scene8Engagement"
        component={Scene8Engagement}
        durationInFrames={225}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          brandName: "PotInAi",
        }}
      />
    </>
  );
};
