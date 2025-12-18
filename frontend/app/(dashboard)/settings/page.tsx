"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api-client";
import { LinkedInConnect } from "@/components/LinkedInConnect";
import { GoogleConnect } from "@/components/GoogleConnect";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await api.user.getPreferences();
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.user.updatePreferences(preferences);
      alert("Preferences saved successfully!");
    } catch (error: any) {
      alert("Failed to save: " + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  const updateDistribution = (key: string, value: number) => {
    setPreferences((prev: any) => ({
      ...prev,
      post_type_distribution: {
        ...prev.post_type_distribution,
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#0A66C2] mx-auto mb-4"></div>
          <p className="text-[#666666]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2F0] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-black mb-8">Settings</h1>

        <Tabs defaultValue="preferences" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-[#E0DFDC] p-1 rounded-lg">
            <TabsTrigger 
              value="preferences"
              className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white"
            >
              Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="account"
              className="data-[state=active]:bg-[#0A66C2] data-[state=active]:text-white"
            >
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="mt-6">
            <Card className="p-8 bg-white border border-[#E0DFDC] shadow-linkedin-md">
              <h2 className="text-2xl font-bold text-black mb-6">Post Type Distribution</h2>
              <p className="text-sm text-[#666666] mb-6">
                Adjust how often each post format should be suggested when using auto mode
              </p>
              
              <div className="space-y-8">
                {Object.entries(preferences?.post_type_distribution || {}).map(([key, value]: [string, any]) => {
                  const labels: Record<string, string> = {
                    text_only: "Text Only",
                    text_with_image: "Text + Image",
                    carousel: "Carousel",
                    video: "Video",
                  };
                  const numValue = Number(value);
                  return (
                    <div key={key}>
                      <div className="flex justify-between mb-3">
                        <Label className="text-sm font-semibold text-black">
                          {labels[key] || key}
                        </Label>
                        <span className="text-sm font-bold text-[#0A66C2]">
                          {numValue}%
                        </span>
                      </div>
                      {/* Visual bar */}
                      <div className="h-2 bg-[#E0DFDC] rounded-full mb-2 overflow-hidden">
                        <div
                          className="h-full bg-[#0A66C2] transition-all duration-300"
                          style={{ width: `${numValue}%` }}
                        />
                      </div>
                      <Slider
                        value={[numValue]}
                        onValueChange={(v) => updateDistribution(key, v[0])}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 pt-8 border-t border-[#E0DFDC]">
                <h3 className="font-bold text-lg text-black mb-6">Other Preferences</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-3">
                      <Label className="text-sm font-semibold text-black">
                        Default Hashtag Count
                      </Label>
                      <span className="text-sm font-bold text-[#0A66C2]">
                        {preferences?.hashtag_count || 4}
                      </span>
                    </div>
                    <Slider
                      value={[preferences?.hashtag_count || 4]}
                      onValueChange={(v) =>
                        setPreferences((prev: any) => ({ ...prev, hashtag_count: v[0] }))
                      }
                      max={10}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card className="p-8 bg-white border border-[#E0DFDC] shadow-linkedin-md">
              <h2 className="text-2xl font-bold text-black mb-4">Profile Information</h2>
              <p className="text-[#666666] mb-6">
                View and manage your profile data and writing style
              </p>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-[#E0DFDC] hover:border-[#0A66C2]" 
                  disabled
                >
                  📄 View Profile Markdown
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-[#E0DFDC] hover:border-[#0A66C2]" 
                  disabled
                >
                  ✍️ View Writing Style
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-[#E0DFDC] hover:border-[#0A66C2]" 
                  disabled
                >
                  📎 Update CV
                </Button>
              </div>
              <p className="text-xs text-[#999999] mt-6">
                Profile management features coming soon
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <div className="space-y-6">
              {/* Connected Accounts Section */}
              <Card className="p-8 bg-white border border-[#E0DFDC] shadow-linkedin-md">
                <h2 className="text-2xl font-bold text-black mb-6">Connected Accounts</h2>
                <p className="text-[#666666] mb-6">
                  Manage your linked social accounts
                </p>
                <div className="space-y-4">
                  <LinkedInConnect />
                  <GoogleConnect />
                </div>
              </Card>
              
              <Card className="p-8 bg-white border border-[#E0DFDC] shadow-linkedin-md">
                <h2 className="text-2xl font-bold text-black mb-4">Subscription</h2>
                <p className="text-[#666666] mb-6">
                  Manage your subscription plan
                </p>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-black mb-2">Current Plan</h3>
                    <div className="bg-[#F3F2F0] p-4 rounded-lg">
                      <p className="text-lg font-bold text-[#0A66C2]">Free Plan</p>
                      <p className="text-sm text-[#666666] mt-1">5 posts per month</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-[#E0DFDC] hover:border-[#0A66C2]" 
                    disabled
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Fixed Save Button */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-[280px] bg-white border-t border-[#E0DFDC] p-4 shadow-linkedin-lg">
          <div className="max-w-4xl mx-auto flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full px-8"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


