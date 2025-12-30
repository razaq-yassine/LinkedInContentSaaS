"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Briefcase, Users, Target, Lightbulb } from "lucide-react";
import CollapsibleSection, { Field } from "@/components/onboarding/CollapsibleSection";
import FieldEditor from "@/components/onboarding/FieldEditor";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

interface Step5Props {
  profileData: any;
  tokenUsage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    model?: string;
    provider?: string;
    details?: {
      [key: string]: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
    };
  } | null;
  onComplete: (preferences: any) => void;
  onBack: () => void;
}

export default function Step5Preview({ profileData, tokenUsage, onComplete, onBack }: Step5Props) {
  const [context, setContext] = useState(profileData.profile_context || {});
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

  const aiGeneratedFields = context.ai_generated_fields || [];

  const handleFieldUpdate = async (section: string, fieldKey: string, value: any) => {
    try {
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
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

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

  // Expertise Fields
  const expertiseFields: Field[] = [
    {
      key: "expertise",
      label: "Skills & Expertise",
      value: context.expertise || [],
      type: "array",
      aiGenerated: aiGeneratedFields.includes("expertise"),
      editable: true,
    },
  ];

  // Target Audience Fields
  const targetAudienceFields: Field[] = [
    {
      key: "target_audience",
      label: "Target Audience",
      value: context.target_audience || [],
      type: "array",
      aiGenerated: aiGeneratedFields.includes("target_audience"),
      aiReasoning: "Inferred from your role and industry",
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

  // Content Mix Fields
  const contentMixFields: Field[] = [
    {
      key: "content_mix",
      label: "Content Mix",
      value: context.content_mix || [],
      type: "array",
      aiGenerated: aiGeneratedFields.includes("content_mix"),
      aiReasoning: "Industry-specific content distribution",
      editable: true,
    },
  ];

  // Combined Content Ideas (Evergreen + Trending)
  const evergreenIdeas = context.content_ideas_evergreen || [];
  const trendingIdeas = context.content_ideas_trending || [];
  const contentIdeasFields: Field[] = [
    {
      key: "content_ideas",
      label: "Content Ideas",
      value: [...evergreenIdeas, ...trendingIdeas],
      type: "array",
      aiGenerated: false,
      editable: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Review Your Profile Context</h2>
        <p className="text-slate-600">
          Review and edit the AI-generated profile. Fields marked with{" "}
          <span className="inline-flex items-center gap-1 text-purple-700 font-medium">
            ✨ AI Suggested
          </span>{" "}
          were intelligently generated based on your CV.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Personal Information */}
        <CollapsibleSection
          title="Personal Information"
          description="Your basic professional details"
          fields={personalInfoFields}
          onFieldUpdate={(key, value) => handleFieldUpdate("personal_info", key, value)}
          defaultExpanded={true}
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
          fields={expertiseFields}
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
          fields={targetAudienceFields}
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
          fields={contentMixFields}
          onFieldUpdate={(key, value) => handleFieldUpdate("content_mix", key, value)}
          icon={<Target className="h-5 w-5" />}
        >
          <div className="space-y-2">
            {(context.content_mix || []).map((mix: any, index: number) => (
              <div key={index} className="flex justify-between items-center bg-[#F3F2F0] p-3 rounded-md">
                <span className="text-sm font-medium">{mix.category}</span>
                <span className="text-sm text-[#0A66C2] font-semibold">{mix.percentage}%</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Combined Content Ideas */}
        <CollapsibleSection
          title="Content Ideas"
          description={`${evergreenIdeas.length + trendingIdeas.length} topic ideas for your LinkedIn posts`}
          fields={contentIdeasFields}
          onFieldUpdate={() => {}}
          icon={<Lightbulb className="h-5 w-5" />}
        >
          <div className="space-y-6">
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
      </div>

      {/* Token Usage Display */}
      {tokenUsage && (
        <div className="mb-6 flex items-center gap-3 text-xs bg-[#F9F9F9] px-4 py-3 rounded-lg border border-[#E0DFDC]">
          <div className="flex items-center gap-1">
            <span className="text-[#666666] font-medium">Tokens Used:</span>
            <span className="font-mono font-semibold text-[#0A66C2]">
              {tokenUsage.total_tokens.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#666666]">Input:</span>
            <span className="font-mono text-green-600 font-medium">
              {tokenUsage.input_tokens.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[#666666]">Output:</span>
            <span className="font-mono text-orange-600 font-medium">
              {tokenUsage.output_tokens.toLocaleString()}
            </span>
          </div>
          {tokenUsage.provider && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[#666666] text-[10px]">
                {tokenUsage.provider.charAt(0).toUpperCase() + tokenUsage.provider.slice(1)}
                {tokenUsage.model && ` (${tokenUsage.model})`}
              </span>
            </div>
          )}
        </div>
      )}

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
