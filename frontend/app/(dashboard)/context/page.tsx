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
import { AppLoader } from "@/components/AppLoader";

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
        <AppLoader message="Loading your profile context..." />
      </div>
    );
  }

  if (!context) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center">
          <p className="text-[#666666] dark:text-slate-400">No profile context found. Please complete onboarding first.</p>
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
    <div className="w-full max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8 overflow-x-hidden">
      {/* Header - Mobile optimized with sticky save status */}
      <div className="mb-4 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-3xl font-bold mb-1 md:mb-2 text-gray-900 dark:text-white">Profile Context</h1>
            <p className="text-xs md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Manage your profile context for generating posts
            </p>
          </div>
          {saveStatus !== "idle" && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 self-start md:self-auto text-xs md:text-sm px-2.5 py-1">
              {saveStatus === "saving" ? "Saving..." : "✓ Saved"}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2.5 md:space-y-4 mb-6 md:mb-8 w-full overflow-hidden">
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
          <div className="space-y-2 md:space-y-4 overflow-hidden">
            {(context.expertise || []).map((skill: any, index: number) => (
              <div key={index} className="bg-[#F3F2F0] dark:bg-slate-700 p-3 md:p-4 rounded-lg overflow-hidden">
                {/* Mobile: Stacked card layout for better touch and readability */}
                <div className="md:hidden space-y-1.5 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#333] dark:text-white truncate flex-1">{skill.skill}</p>
                    {skill.ai_generated && (
                      <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                        AI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#666666] dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-[#333] dark:text-slate-300">Level:</span>
                      <span className="truncate">{skill.level}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-[#333] dark:text-slate-300">Yrs:</span>
                      <span>{skill.years}</span>
                    </div>
                  </div>
                </div>
                {/* Desktop: Grid layout */}
                <div className="hidden md:grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#333] dark:text-slate-300">Skill</p>
                    <p className="text-sm text-[#666666] dark:text-slate-400 truncate">{skill.skill}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#333] dark:text-slate-300">Level</p>
                    <p className="text-sm text-[#666666] dark:text-slate-400">{skill.level}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#333] dark:text-slate-300">Years</p>
                    <p className="text-sm text-[#666666] dark:text-slate-400">{skill.years}</p>
                  </div>
                  {skill.ai_generated && (
                    <div>
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
          <div className="space-y-2 md:space-y-3 overflow-hidden">
            {(context.target_audience || []).map((audience: any, index: number) => (
              <div key={index} className="bg-[#F3F2F0] dark:bg-slate-700 p-3 md:p-4 rounded-lg overflow-hidden">
                <p className="font-semibold text-sm md:text-base text-[#333] dark:text-white truncate">{audience.persona}</p>
                <p className="text-[11px] md:text-sm text-[#666666] dark:text-slate-400 mt-1 leading-relaxed line-clamp-2 md:line-clamp-none">{audience.description}</p>
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
          <div className="space-y-1.5 overflow-hidden">
            {Array.isArray(context.content_mix) && context.content_mix.length > 0 ? (
              context.content_mix.map((mix: any, index: number) => (
                <div key={index} className="flex justify-between items-center bg-[#F3F2F0] dark:bg-slate-700 p-2.5 md:p-3 rounded-lg min-h-[40px] overflow-hidden">
                  <span className="text-xs md:text-sm font-medium truncate mr-2 flex-1 text-black dark:text-white">{mix.category}</span>
                  <span className="text-xs md:text-sm text-[#0A66C2] font-bold flex-shrink-0 bg-white px-2 py-0.5 rounded-full">{mix.percentage}%</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#666666] dark:text-slate-400">No content mix configured</p>
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
          <div className="space-y-4 md:space-y-6 overflow-hidden">
            {/* Action Buttons - Mobile optimized with full-width touch targets */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <Button
                onClick={handleGenerateMoreIdeas}
                disabled={generatingIdeas}
                variant="outline"
                className="w-full md:w-auto min-h-[44px] border-[#0A66C2] text-[#0A66C2] hover:bg-[#EEF3F8] active:bg-[#D4E5F7] text-sm font-medium touch-manipulation"
              >
                {generatingIdeas ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0A66C2] mr-2"></div>
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
                className="w-full md:w-auto min-h-[44px] border-purple-600 text-purple-700 hover:bg-purple-50 active:bg-purple-100 text-sm font-medium touch-manipulation"
              >
                {refreshingTrending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline">Refresh Trending Topics</span>
                    <span className="md:hidden">Refresh Trending</span>
                  </>
                )}
              </Button>
            </div>

            {/* Topic Ideas Section */}
            {evergreenIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-xs md:text-sm text-[#0A66C2] tracking-wide">TOPIC IDEAS</h4>
                  <Badge variant="outline" className="text-[10px] md:text-xs px-2 py-0.5">
                    {evergreenIdeas.length} ideas
                  </Badge>
                </div>
                <div className="space-y-1.5 overflow-hidden">
                  {evergreenIdeas.map((idea: any, index: number) => (
                    <div
                      key={`evergreen-${index}`}
                      className="flex items-start gap-2.5 p-2.5 md:p-3 bg-[#F3F2F0] rounded-lg hover:bg-[#E8E7E5] active:bg-[#DDDCDA] transition-colors min-h-[40px] overflow-hidden"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <Lightbulb className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#0A66C2]" />
                      </div>
                      <p className="text-xs md:text-sm font-medium text-black flex-1 leading-relaxed line-clamp-2">{idea.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics Section */}
            {trendingIdeas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-xs md:text-sm text-purple-700 tracking-wide">TRENDING TOPICS</h4>
                  <Badge variant="outline" className="text-[10px] md:text-xs px-2 py-0.5 bg-purple-50 text-purple-700 border-purple-200">
                    {trendingIdeas.length} topics
                  </Badge>
                </div>
                <div className="space-y-1.5 overflow-hidden">
                  {trendingIdeas.map((idea: any, index: number) => (
                    <div
                      key={`trending-${index}`}
                      className="flex items-start gap-2.5 p-2.5 md:p-3 bg-purple-50 rounded-lg hover:bg-purple-100 active:bg-purple-150 transition-colors border border-purple-100 min-h-[40px] overflow-hidden"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <svg
                          className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600"
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
                      <p className="text-xs md:text-sm font-medium text-purple-900 flex-1 leading-relaxed line-clamp-2">{idea.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Additional Context and Rules - Mobile optimized */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-linkedin-md border border-[#E0DFDC] dark:border-slate-700 p-3 md:p-6 overflow-hidden">
          <div className="flex items-start gap-2.5 mb-3 overflow-hidden">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <h3 className="text-sm md:text-lg font-semibold text-black dark:text-white leading-tight truncate">Additional Context</h3>
              <p className="text-[11px] md:text-sm text-[#666666] dark:text-slate-400 mt-0.5 truncate md:whitespace-normal">Customize tone and content guidelines</p>
            </div>
          </div>
          <div className="space-y-3 md:space-y-4">
            <div>
              <Label className="text-xs md:text-sm font-medium text-black dark:text-white mb-2 block">
                Custom Instructions (Optional)
              </Label>
              <Textarea
                placeholder="Add your preferences for tone, style, topics to focus on or avoid..."
                value={context.additional_context || ""}
                onChange={(e) => handleFieldUpdate("additional_context", "additional_context", e.target.value)}
                rows={4}
                className="resize-none text-sm md:text-base min-h-[120px] md:min-h-[140px] touch-manipulation"
              />
              <p className="text-[11px] md:text-xs text-[#666666] dark:text-slate-400 mt-2">
                {(context.additional_context || "").length}/500 characters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

