"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { X, User, Briefcase, Users, Target, Lightbulb, Sparkles } from "lucide-react";

interface ContextConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContextConfigModal({ open, onOpenChange }: ContextConfigModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [additionalContext, setAdditionalContext] = useState("");

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileRes = await api.user.getProfile();
      const contextJson = profileRes.data?.context_json || {};
      setContext(contextJson);
      
      // Get additional_context from context_json (now part of TOON context)
      const additionalContextText = contextJson.additional_context || profileRes.data?.custom_instructions || "";
      setAdditionalContext(additionalContextText);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      // Set defaults on error
      setContext(null);
      setAdditionalContext("");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save additional_context directly (backend will store it in context_json)
      await api.user.updateCustomInstructions(additionalContext);
      onOpenChange(false);
    } catch (error: any) {
      alert("Failed to save: " + (error.response?.data?.detail || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal */}
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl mx-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A66C2] mx-auto mb-4"></div>
              <p className="text-[#666666]">Loading context...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[#E0DFDC] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-black">Context Configuration</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 hover:bg-[#F3F2F0] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#666666]" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-5">
              {/* Section 1: Additional Context (Editable) - Moved to Top */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-base">Generation Rules &amp; Preferences</h3>
                </div>

                <div>
                  <Label className="text-xs font-medium text-black mb-1.5 block">
                    Additional Context and Rules (Optional)
                  </Label>
                  <Textarea
                    placeholder="Specify tone, style, format preferences, content guidelines, brand voice, topics to avoid, or any specific rules for content generation..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={5}
                    className="resize-none border-[#E0DFDC] focus:border-[#0A66C2] focus:ring-[#0A66C2] text-xs"
                  />
                  <p className="text-[10px] text-[#666666] mt-1.5">
                    {additionalContext.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Section 2: Context Summary (Analytics View) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-[#0A66C2]" />
                    </div>
                    <h3 className="font-semibold text-base">Business or Personal Details</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open('/context', '_blank')}
                    className="text-xs text-[#0A66C2] hover:text-[#004182] h-7 px-3"
                  >
                    Edit in Context Page →
                  </Button>
                </div>

                {context ? (
                  <>
                    {/* Stats Cards Grid */}
                    <div className="grid grid-cols-4 gap-2">
                      {/* Personal Info Card */}
                      <Card className="p-1.5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                        <div className="flex items-center gap-1 mb-0.5">
                          <User className="w-3 h-3 text-[#0A66C2]" />
                          <span className="text-[10px] font-semibold text-[#0A66C2] leading-tight">PROFILE</span>
                        </div>
                        <p className="text-sm font-bold text-black truncate leading-tight" title={context.personal_info?.name || context.name || ""}>
                          {context.personal_info?.name || context.name || "—"}
                        </p>
                        <p className="text-[10px] text-[#666666] truncate leading-tight">
                          {context.personal_info?.current_role || context.current_role || "No role"}
                        </p>
                      </Card>

                      {/* Expertise Card */}
                      <Card className="p-1.5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Briefcase className="w-3 h-3 text-purple-600" />
                          <span className="text-[10px] font-semibold text-purple-600 leading-tight">SKILLS</span>
                        </div>
                        <p className="text-base font-bold text-black leading-tight">
                          {context.expertise?.length || 0}
                        </p>
                        <p className="text-[10px] text-[#666666] leading-tight">
                          {context.expertise?.length ? "defined" : "none"}
                        </p>
                      </Card>

                      {/* Audience Card */}
                      <Card className="p-1.5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Users className="w-3 h-3 text-green-600" />
                          <span className="text-[10px] font-semibold text-green-600 leading-tight">AUDIENCE</span>
                        </div>
                        <p className="text-base font-bold text-black leading-tight">
                          {context.target_audience?.length || 0}
                        </p>
                        <p className="text-[10px] text-[#666666] leading-tight">
                          {context.target_audience?.length ? "personas" : "none"}
                        </p>
                      </Card>

                      {/* Content Ideas Card */}
                      <Card className="p-1.5 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Lightbulb className="w-3 h-3 text-orange-600" />
                          <span className="text-[10px] font-semibold text-orange-600 leading-tight">IDEAS</span>
                        </div>
                        <p className="text-base font-bold text-black leading-tight">
                          {(context.content_ideas_evergreen?.length || 0) + (context.content_ideas_trending?.length || 0)}
                        </p>
                        <p className="text-[10px] text-[#666666] leading-tight">
                          topics
                        </p>
                      </Card>
                    </div>

                    {/* Context Summary Card */}
                    <Card className="p-4 bg-[#F9FAFB] border-[#E0DFDC]">
                      <div className="space-y-3">
                        {/* Content Strategy - Most Important */}
                        {(context.tone || context.posting_frequency || context.content_goals) && (
                          <div>
                            <h4 className="text-[10px] font-semibold text-[#0A66C2] mb-2">CONTENT STRATEGY</h4>
                            <div className="space-y-2">
                              {context.tone && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-[#666666] min-w-[60px]">Tone:</span>
                                  <span className="px-2.5 py-1 bg-white border border-[#E0DFDC] rounded-full text-xs font-semibold text-black">
                                    {context.tone}
                                  </span>
                                </div>
                              )}
                              {context.posting_frequency && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-[#666666] min-w-[60px]">Frequency:</span>
                                  <span className="text-xs text-black">{context.posting_frequency}</span>
                                </div>
                              )}
                              {context.content_goals && Array.isArray(context.content_goals) && context.content_goals.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-medium text-[#666666] min-w-[60px]">Goals:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {context.content_goals.slice(0, 4).map((goal: string, idx: number) => (
                                      <span key={idx} className="px-2 py-0.5 bg-white border border-[#E0DFDC] rounded-full text-[10px] text-black">
                                        {goal}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Top Skills - Key Expertise */}
                        {context.expertise && Array.isArray(context.expertise) && context.expertise.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-semibold text-[#0A66C2] mb-2">KEY EXPERTISE</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {context.expertise.slice(0, 6).map((exp: any, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 bg-white border border-[#E0DFDC] rounded-full text-xs text-black font-medium">
                                  {typeof exp === 'string' ? exp : exp.skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Target Audience */}
                        {context.target_audience && Array.isArray(context.target_audience) && context.target_audience.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-semibold text-[#0A66C2] mb-2">TARGET AUDIENCE</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {context.target_audience.slice(0, 3).map((aud: any, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 bg-white border border-[#E0DFDC] rounded-full text-xs text-black font-medium">
                                  {typeof aud === 'string' ? aud : aud.persona}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Personal Info - Minimal */}
                        {(context.current_role || context.industry || context.company) && (
                          <div>
                            <h4 className="text-[10px] font-semibold text-[#0A66C2] mb-2">BACKGROUND</h4>
                            <p className="text-xs text-black leading-relaxed">
                              {[
                                context.current_role,
                                context.company && `at ${context.company}`,
                                context.industry && `(${context.industry})`,
                              ].filter(Boolean).join(" ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </>
                ) : (
                  <Card className="p-6 text-center bg-[#F9FAFB] border-[#E0DFDC]">
                    <p className="text-xs text-[#666666]">No context available. Please complete onboarding to add your profile context.</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[#E0DFDC] px-6 py-3 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#E0DFDC] h-9 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white h-9 text-sm"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Save Context
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

