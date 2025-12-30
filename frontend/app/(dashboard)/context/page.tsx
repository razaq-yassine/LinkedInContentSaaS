"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Users, Target, Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CollapsibleSection, { Field } from "@/components/onboarding/CollapsibleSection";
import FieldEditor from "@/components/onboarding/FieldEditor";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

export default function ContextPage() {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingTrending, setRefreshingTrending] = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    loadProfileContext();
  }, []);

  const loadProfileContext = async () => {
    try {
      setLoading(true);
      const response = await api.user.getProfile();
      const profile = response.data;
      
      // Helper function to convert content_mix object to array format if needed
      const normalizeContentMix = (contentMix: any): any[] => {
        if (!contentMix) return [];
        if (Array.isArray(contentMix)) return contentMix;
        if (typeof contentMix === 'object') {
          // Convert object format {category: percentage} to array format [{category, percentage}]
          return Object.entries(contentMix).map(([category, percentage]) => ({
            category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            percentage: percentage
          }));
        }
        return [];
      };

      // Build context structure from profile data
      const profileContext = {
        personal_info: {
          name: profile.context_json?.name || "",
          current_role: profile.context_json?.current_role || "",
          company: profile.context_json?.company || "",
          industry: profile.context_json?.industry || "",
          years_experience: profile.context_json?.years_experience || 0,
        },
        expertise: profile.context_json?.expertise || [],
        target_audience: profile.context_json?.target_audience || [],
        content_strategy: {
          content_goals: profile.context_json?.content_goals || [],
          posting_frequency: profile.context_json?.posting_frequency || "2-3x per week",
          tone: profile.context_json?.tone || "professional",
        },
        content_mix: normalizeContentMix(profile.context_json?.content_mix),
        content_ideas_evergreen: profile.context_json?.content_ideas_evergreen || [],
        content_ideas_trending: profile.context_json?.content_ideas_trending || [],
        ai_generated_fields: profile.context_json?.ai_generated_fields || [],
        additional_context: profile.context_json?.additional_context || profile.custom_instructions || "",
      };

      setContext(profileContext);
    } catch (error) {
      console.error("Failed to load profile context:", error);
      alert("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = async (section: string, fieldKey: string, value: any) => {
    try {
      setSaveStatus("saving");
      
      // Update local state
      const updatedContext = { ...context };
      if (section === "personal_info") {
        updatedContext.personal_info = { ...updatedContext.personal_info, [fieldKey]: value };
      } else if (section === "content_strategy") {
        updatedContext.content_strategy = { ...updatedContext.content_strategy, [fieldKey]: value };
      } else {
        updatedContext[section] = value;
      }
      setContext(updatedContext);

      // Save to backend
      await api.onboarding.updateField(section, fieldKey, value);
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to update field:", error);
      setSaveStatus("idle");
      alert("Failed to save changes. Please try again.");
    }
  };

  const handleRefreshTrending = async () => {
    try {
      setRefreshingTrending(true);
      
      // Call backend to refresh trending topics
      const response = await api.user.refreshTrendingTopics();
      
      // Update context with new trending topics
      setContext({
        ...context,
        content_ideas_trending: response.data.trending_topics || [],
      });
      
      alert("Trending topics refreshed successfully!");
    } catch (error) {
      console.error("Failed to refresh trending topics:", error);
      alert("Failed to refresh trending topics. Please try again.");
    } finally {
      setRefreshingTrending(false);
    }
  };

  const handleGenerateMoreIdeas = async () => {
    try {
      setGeneratingIdeas(true);
      
      // Call backend to generate more content ideas
      const response = await api.user.generateContentIdeas();
      
      // Add new ideas to existing ones
      setContext({
        ...context,
        content_ideas_evergreen: [
          ...context.content_ideas_evergreen,
          ...(response.data.content_ideas || []),
        ],
      });
      
      alert(`Generated ${response.data.content_ideas?.length || 0} new content ideas!`);
    } catch (error) {
      console.error("Failed to generate content ideas:", error);
      alert("Failed to generate content ideas. Please try again.");
    } finally {
      setGeneratingIdeas(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2] mx-auto"></div>
          <p className="mt-4 text-[#666666]">Loading your profile context...</p>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <p className="text-[#666666]">No profile context found. Please complete onboarding first.</p>
        </div>
      </div>
    );
  }

  const aiGeneratedFields = context.ai_generated_fields || [];

  // Personal Information Fields
  const personalInfoFields: Field[] = [
    {
      key: "name",
      label: "Full Name",
      value: context.personal_info?.name || "",
      type: "text",
      aiGenerated: aiGeneratedFields.includes("name"),
      editable: true,
    },
    {
      key: "current_role",
      label: "Current Role",
      value: context.personal_info?.current_role || "",
      type: "text",
      aiGenerated: aiGeneratedFields.includes("current_role"),
      editable: true,
    },
    {
      key: "company",
      label: "Company",
      value: context.personal_info?.company || "",
      type: "text",
      aiGenerated: aiGeneratedFields.includes("company"),
      editable: true,
    },
    {
      key: "industry",
      label: "Industry",
      value: context.personal_info?.industry || "",
      type: "text",
      aiGenerated: aiGeneratedFields.includes("industry"),
      editable: true,
    },
    {
      key: "years_experience",
      label: "Years of Experience",
      value: context.personal_info?.years_experience || 0,
      type: "number",
      aiGenerated: aiGeneratedFields.includes("years_experience"),
      editable: true,
    },
  ];

  // Content Strategy Fields
  const contentStrategyFields: Field[] = [
    {
      key: "content_goals",
      label: "Content Goals",
      value: context.content_strategy?.content_goals || [],
      type: "chips",
      aiGenerated: aiGeneratedFields.includes("content_goals"),
      editable: true,
    },
    {
      key: "posting_frequency",
      label: "Posting Frequency",
      value: context.content_strategy?.posting_frequency || "2-3x per week",
      type: "select",
      options: ["1x per week", "2-3x per week", "3-5x per week", "Daily"],
      aiGenerated: aiGeneratedFields.includes("posting_frequency"),
      aiReasoning: "Based on industry best practices",
      alternatives: ["1x per week", "3-5x per week", "Daily"],
      editable: true,
    },
    {
      key: "tone",
      label: "Tone of Voice",
      value: context.content_strategy?.tone || "professional",
      type: "select",
      options: [
        "professional",
        "casual",
        "technical",
        "storytelling",
        "thought-leader",
        "educator",
      ],
      aiGenerated: aiGeneratedFields.includes("tone"),
      aiReasoning: "Matches your industry and role",
      alternatives: ["technical yet accessible", "storytelling-focused"],
      editable: true,
    },
  ];

  const evergreenIdeas = context.content_ideas_evergreen || [];
  const trendingIdeas = context.content_ideas_trending || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Profile Context</h1>
            <p className="text-slate-600">
              Manage your profile context used for generating LinkedIn posts
            </p>
          </div>
          {saveStatus !== "idle" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {saveStatus === "saving" ? "Saving..." : "✓ Saved"}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {/* Personal Information */}
        <CollapsibleSection
          title="Personal Information"
          description="Your basic professional details"
          fields={personalInfoFields}
          onFieldUpdate={(key, value) => handleFieldUpdate("personal_info", key, value)}
          defaultExpanded={false}
          icon={<User className="h-5 w-5" />}
        >
          {personalInfoFields.map((field) => (
            <FieldEditor
              key={field.key}
              label={field.label}
              value={field.value}
              type={field.type}
              options={field.options}
              aiGenerated={field.aiGenerated}
              aiReasoning={field.aiReasoning}
              alternatives={field.alternatives}
              editable={field.editable}
              onChange={(value) => handleFieldUpdate("personal_info", field.key, value)}
            />
          ))}
        </CollapsibleSection>

        {/* Expertise & Skills */}
        <CollapsibleSection
          title="Expertise & Skills"
          description="Your professional skills and experience levels"
          fields={[{ key: "expertise", label: "Skills", value: context.expertise, type: "array" }]}
          onFieldUpdate={(key, value) => handleFieldUpdate("expertise", key, value)}
          icon={<Briefcase className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {(context.expertise || []).map((skill: any, index: number) => (
              <div key={index} className="bg-[#F3F2F0] p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Skill</p>
                    <p className="text-sm text-[#666666]">{skill.skill}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Level</p>
                    <p className="text-sm text-[#666666]">{skill.level}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Years</p>
                    <p className="text-sm text-[#666666]">{skill.years}</p>
                  </div>
                  {skill.ai_generated && (
                    <div className="col-span-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        AI Suggested
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Target Audience */}
        <CollapsibleSection
          title="Target Audience"
          description="Who you're creating content for"
          fields={[{ key: "target_audience", label: "Audience", value: context.target_audience, type: "array" }]}
          onFieldUpdate={(key, value) => handleFieldUpdate("target_audience", key, value)}
          icon={<Users className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {(context.target_audience || []).map((audience: any, index: number) => (
              <div key={index} className="bg-[#F3F2F0] p-4 rounded-md">
                <p className="font-medium text-sm">{audience.persona}</p>
                <p className="text-sm text-[#666666] mt-1">{audience.description}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Content Strategy */}
        <CollapsibleSection
          title="Content Strategy"
          description="Your content goals, frequency, and tone"
          fields={contentStrategyFields}
          onFieldUpdate={(key, value) => handleFieldUpdate("content_strategy", key, value)}
          icon={<Target className="h-5 w-5" />}
        >
          {contentStrategyFields.map((field) => (
            <FieldEditor
              key={field.key}
              label={field.label}
              value={field.value}
              type={field.type}
              options={field.options}
              aiGenerated={field.aiGenerated}
              aiReasoning={field.aiReasoning}
              alternatives={field.alternatives}
              editable={field.editable}
              onChange={(value) => handleFieldUpdate("content_strategy", field.key, value)}
            />
          ))}
        </CollapsibleSection>

        {/* Content Mix */}
        <CollapsibleSection
          title="Content Mix"
          description="Distribution of content types"
          fields={[{ key: "content_mix", label: "Mix", value: context.content_mix, type: "array" }]}
          onFieldUpdate={(key, value) => handleFieldUpdate("content_mix", key, value)}
          icon={<Target className="h-5 w-5" />}
        >
          <div className="space-y-2">
            {Array.isArray(context.content_mix) && context.content_mix.length > 0 ? (
              context.content_mix.map((mix: any, index: number) => (
                <div key={index} className="flex justify-between items-center bg-[#F3F2F0] p-3 rounded-md">
                  <span className="text-sm font-medium">{mix.category}</span>
                  <span className="text-sm text-[#0A66C2] font-semibold">{mix.percentage}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#666666]">No content mix configured</p>
            )}
          </div>
        </CollapsibleSection>

        {/* Combined Content Ideas */}
        <CollapsibleSection
          title="Content Ideas"
          description={`${evergreenIdeas.length + trendingIdeas.length} topic ideas for your LinkedIn posts`}
          fields={[{ key: "content_ideas", label: "Ideas", value: [], type: "array" }]}
          onFieldUpdate={() => {}}
          icon={<Lightbulb className="h-5 w-5" />}
        >
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateMoreIdeas}
                disabled={generatingIdeas}
                variant="outline"
                size="sm"
                className="border-[#0A66C2] text-[#0A66C2] hover:bg-[#EEF3F8]"
              >
                {generatingIdeas ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#0A66C2] mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate More Ideas
                  </>
                )}
              </Button>
              <Button
                onClick={handleRefreshTrending}
                disabled={refreshingTrending}
                variant="outline"
                size="sm"
                className="border-purple-600 text-purple-700 hover:bg-purple-50"
              >
                {refreshingTrending ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Trending Topics
                  </>
                )}
              </Button>
            </div>

            {/* Topic Ideas Section */}
            {evergreenIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-sm text-[#0A66C2]">TOPIC IDEAS</h4>
                  <Badge variant="outline" className="text-xs">
                    {evergreenIdeas.length} ideas
                  </Badge>
                </div>
                <div className="space-y-2">
                  {evergreenIdeas.map((idea: any, index: number) => (
                    <div
                      key={`evergreen-${index}`}
                      className="flex items-center gap-3 p-3 bg-[#F3F2F0] rounded-md hover:bg-[#E8E7E5] transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <Lightbulb className="h-4 w-4 text-[#0A66C2]" />
                      </div>
                      <p className="text-sm font-medium text-black flex-1">{idea.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics Section */}
            {trendingIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-sm text-purple-700">TRENDING TOPICS</h4>
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    {trendingIdeas.length} topics
                  </Badge>
                </div>
                <div className="space-y-2">
                  {trendingIdeas.map((idea: any, index: number) => (
                    <div
                      key={`trending-${index}`}
                      className="flex items-center gap-3 p-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors border border-purple-100"
                    >
                      <div className="flex-shrink-0">
                        <svg
                          className="h-4 w-4 text-purple-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-purple-900 flex-1">{idea.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Additional Context and Rules */}
        <div className="bg-white rounded-xl shadow-linkedin-md border border-[#E0DFDC] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-black">Additional Context and Rules</h3>
              <p className="text-sm text-[#666666]">Specify tone, style, format preferences, content guidelines, brand voice, topics to avoid, or any specific rules for content generation</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-black mb-2 block">
                Additional Context and Rules (Optional)
              </Label>
              <Textarea
                placeholder="Specify tone, style, format preferences, content guidelines, brand voice, topics to avoid, or any specific rules for content generation..."
                value={context.additional_context || ""}
                onChange={(e) => handleFieldUpdate("additional_context", "additional_context", e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-[#666666] mt-2">
                {(context.additional_context || "").length}/500 characters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

