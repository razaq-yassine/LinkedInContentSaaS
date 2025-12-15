"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Step5Props {
  profileData: any;
  onComplete: (preferences: any) => void;
  onBack: () => void;
}

export default function Step5Preview({ profileData, onComplete, onBack }: Step5Props) {
  const [preferences, setPreferences] = useState(
    profileData.preferences || {
      post_type_distribution: {
        text_only: 40,
        text_with_image: 30,
        carousel: 25,
        video: 5,
      },
      hashtag_count: 4,
    }
  );

  const updateDistribution = (key: string, value: number) => {
    setPreferences((prev: any) => ({
      ...prev,
      post_type_distribution: {
        ...prev.post_type_distribution,
        [key]: value,
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Review Your Profile</h2>
        <p className="text-slate-600">
          Here's what we've generated. You can adjust preferences anytime.
        </p>
      </div>

      <Tabs defaultValue="profile" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="style">Writing Style</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">
                {profileData.profile_md || "Generating profile..."}
              </pre>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="style">
          <Card className="p-6">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm">
                {profileData.writing_style_md || "Analyzing writing style..."}
              </pre>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-4">Post Type Distribution (%)</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Text Only: {preferences.post_type_distribution.text_only}%</Label>
                    <Slider
                      value={[preferences.post_type_distribution.text_only]}
                      onValueChange={(v) => updateDistribution("text_only", v[0])}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div>
                    <Label>Text + Image: {preferences.post_type_distribution.text_with_image}%</Label>
                    <Slider
                      value={[preferences.post_type_distribution.text_with_image]}
                      onValueChange={(v) => updateDistribution("text_with_image", v[0])}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div>
                    <Label>Carousel: {preferences.post_type_distribution.carousel}%</Label>
                    <Slider
                      value={[preferences.post_type_distribution.carousel]}
                      onValueChange={(v) => updateDistribution("carousel", v[0])}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div>
                    <Label>Video: {preferences.post_type_distribution.video}%</Label>
                    <Slider
                      value={[preferences.post_type_distribution.video]}
                      onValueChange={(v) => updateDistribution("video", v[0])}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Default Hashtag Count: {preferences.hashtag_count}</Label>
                <Slider
                  value={[preferences.hashtag_count]}
                  onValueChange={(v) =>
                    setPreferences((prev: any) => ({ ...prev, hashtag_count: v[0] }))
                  }
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={() => onComplete(preferences)} size="lg">
          Complete Setup →
        </Button>
      </div>
    </div>
  );
}


