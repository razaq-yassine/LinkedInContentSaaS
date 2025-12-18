"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkedInPostPreview } from "@/components/LinkedInPostPreview";
import {
  Send,
  Settings2,
  X,
  Users,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  post_content?: string;
  format_type?: string;
  image_prompt?: string;
  image_prompts?: string[]; // For carousel posts
  post_id?: string; // Post ID for assistant messages
  metadata?: {
    hashtags?: string[];
    tone?: string;
    estimated_engagement?: string;
  };
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("conversation");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track generated images by message ID (post ID)
  const [currentImages, setCurrentImages] = useState<Record<string, string>>({}); // post_id -> base64 image
  const [imageHistory, setImageHistory] = useState<Record<string, any[]>>({}); // post_id -> array of images
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({}); // post_id -> boolean
  const [showImageHistory, setShowImageHistory] = useState<Record<string, boolean>>({}); // post_id -> boolean
  const [postIdMap, setPostIdMap] = useState<Record<string, string>>({}); // message_id -> post_id

  // Track generated PDFs for carousel posts
  const [currentPDFs, setCurrentPDFs] = useState<Record<string, string>>({}); // post_id -> base64 PDF
  const [currentPDFSlides, setCurrentPDFSlides] = useState<Record<string, string[]>>({}); // post_id -> array of slide images
  const [pdfHistory, setPdfHistory] = useState<Record<string, any[]>>({}); // post_id -> array of PDFs
  const [generatingPDFs, setGeneratingPDFs] = useState<Record<string, boolean>>({}); // post_id -> boolean
  const [pdfProgress, setPdfProgress] = useState<Record<string, { current: number; total: number }>>({}); // post_id -> progress
  const [showPdfHistory, setShowPdfHistory] = useState<Record<string, boolean>>({}); // post_id -> boolean

  // Generation options
  const [postType, setPostType] = useState("auto");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [hashtagCount, setHashtagCount] = useState(4);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Load conversation if ID is provided, otherwise clear messages
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (id: string) => {
    try {
      const response = await api.conversations.get(id);
      const conversation = response.data;
      // Convert conversation messages to UI messages (includes both user and assistant)
      const uiMessages: Message[] = conversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role, // "user" or "assistant"
        content: msg.content,
        post_content: msg.role === "assistant" ? msg.content : undefined,
        format_type: msg.format,
        image_prompt: msg.image_prompt,
        image_prompts: msg.image_prompts, // For carousel posts
        post_id: msg.post_id, // Post ID from backend
        metadata: msg.metadata,
      }));
      setMessages(uiMessages);

      // Build post ID mapping and load images/PDFs
      const newPostIdMap: Record<string, string> = {};
      for (const msg of uiMessages) {
        if (msg.role === "assistant" && msg.post_id) {
          newPostIdMap[msg.id] = msg.post_id;

          if (msg.format_type === 'image' && msg.image_prompt) {
            await loadCurrentImage(msg.post_id);
            await loadImageHistory(msg.post_id);
          } else if (msg.format_type === 'carousel') {
            // Load PDF for carousel posts (don't await - let it fail silently if no PDFs exist yet)
            loadCurrentPDF(msg.post_id).catch(() => { });
            loadPdfHistory(msg.post_id).catch(() => { });
          }
        }
      }
      setPostIdMap(newPostIdMap);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const loadCurrentImage = async (postId: string) => {
    try {
      const response = await api.images.getCurrent(postId);
      if (response.data.image) {
        setCurrentImages(prev => ({
          ...prev,
          [postId]: `data:image/png;base64,${response.data.image}`
        }));
      }
    } catch (error) {
      // No current image yet, that's okay
    }
  };

  const autoGenerateImage = async (postId: string, imagePrompt: string) => {
    if (!imagePrompt) return;

    setGeneratingImages(prev => ({ ...prev, [postId]: true }));

    try {
      const response = await api.images.generateFromPost(postId);
      const imageData = response.data.image;

      // Store the current image
      setCurrentImages(prev => ({
        ...prev,
        [postId]: `data:image/png;base64,${imageData}`
      }));

      // Load image history
      await loadImageHistory(postId);
    } catch (error: any) {
      console.error("Auto image generation failed:", error);
      // Don't show error alert for auto-generation, just log it
    } finally {
      setGeneratingImages(prev => ({ ...prev, [postId]: false }));
    }
  };

  const loadImageHistory = async (postId: string) => {
    try {
      const response = await api.images.getHistory(postId);
      setImageHistory(prev => ({
        ...prev,
        [postId]: response.data.images.map((img: any) => ({
          ...img,
          image: `data:image/png;base64,${img.image}`
        }))
      }));
    } catch (error) {
      console.error("Failed to load image history:", error);
    }
  };

  const autoGenerateCarouselPDF = async (postId: string, prompts: string[]) => {
    if (!prompts || prompts.length === 0) return;

    setGeneratingPDFs(prev => ({ ...prev, [postId]: true }));
    setPdfProgress(prev => ({ ...prev, [postId]: { current: 0, total: prompts.length } }));

    // Start polling for progress
    const progressInterval = setInterval(async () => {
      try {
        const progressResponse = await api.pdfs.getProgress(postId);
        const progress = progressResponse.data;
        setPdfProgress(prev => ({
          ...prev,
          [postId]: { current: progress.current || 0, total: progress.total || prompts.length }
        }));

        if (progress.completed || progress.status === 'completed') {
          clearInterval(progressInterval);
        }
      } catch (error) {
        // Ignore progress polling errors
      }
    }, 1000); // Poll every second

    try {
      const response = await api.pdfs.generateCarousel(postId, prompts);
      const pdfData = response.data.pdf;
      const slideImages = response.data.slide_images || [];

      clearInterval(progressInterval);

      // Store the current PDF
      setCurrentPDFs(prev => ({
        ...prev,
        [postId]: `data:application/pdf;base64,${pdfData}`
      }));

      // Store slide images for preview
      setCurrentPDFSlides(prev => ({
        ...prev,
        [postId]: slideImages
      }));

      // Load PDF history
      await loadPdfHistory(postId);
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Auto PDF generation failed:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Show error to user for debugging
      if (error.response?.data?.detail) {
        console.error("Backend error:", error.response.data.detail);
      }
      // Don't show error alert for auto-generation, just log it
    } finally {
      setGeneratingPDFs(prev => ({ ...prev, [postId]: false }));
      setPdfProgress(prev => ({ ...prev, [postId]: { current: prompts.length, total: prompts.length } }));
    }
  };

  const loadCurrentPDF = async (postId: string) => {
    try {
      const response = await api.pdfs.getCurrent(postId);
      if (response.data.pdf) {
        setCurrentPDFs(prev => ({
          ...prev,
          [postId]: `data:application/pdf;base64,${response.data.pdf}`
        }));
      }
      if (response.data.slide_images && response.data.slide_images.length > 0) {
        setCurrentPDFSlides(prev => ({
          ...prev,
          [postId]: response.data.slide_images
        }));
      }
    } catch (error) {
      // No current PDF yet, that's okay
    }
  };

  const loadPdfHistory = async (postId: string) => {
    try {
      const response = await api.pdfs.getHistory(postId);
      if (response.data && response.data.pdfs) {
        setPdfHistory(prev => ({
          ...prev,
          [postId]: response.data.pdfs.map((pdf: any) => ({
            ...pdf,
            pdf: `data:application/pdf;base64,${pdf.pdf}`,
            slide_images: pdf.slide_images || []
          }))
        }));
      }
    } catch (error: any) {
      // If 404 or no PDFs exist, that's okay - just set empty array
      if (error.response?.status === 404) {
        setPdfHistory(prev => ({ ...prev, [postId]: [] }));
      } else {
        console.error("Failed to load PDF history:", error);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const userMessageObj: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };

    setInput("");
    setMessages((prev) => [...prev, userMessageObj]);
    setLoading(true);

    try {
      const options = {
        post_type: postType,
        tone,
        length,
        hashtag_count: hashtagCount,
      };

      const response = await api.generate.post(
        userMessage,
        options,
        undefined,
        conversationId || undefined
      );
      const data = response.data;

      const assistantMessage: Message = {
        id: data.id,
        role: "assistant",
        content: data.post_content || data.content,
        post_content: data.post_content,
        format_type: data.format_type || data.format,
        image_prompt: data.image_prompt,
        image_prompts: data.image_prompts, // For carousel posts
        post_id: data.id, // Post ID is the same as the response ID
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Store post ID mapping
      setPostIdMap(prev => ({ ...prev, [assistantMessage.id]: data.id }));

      // Auto-generate image/PDF based on format
      if (assistantMessage.format_type === 'image' && assistantMessage.image_prompt) {
        // Single image post
        const postId = data.id;
        autoGenerateImage(postId, assistantMessage.image_prompt);
      } else if (assistantMessage.format_type === 'carousel') {
        // Carousel post - generate PDF
        const postId = data.id;
        // Check for image_prompts array first, then fallback to single image_prompt
        if (assistantMessage.image_prompts && assistantMessage.image_prompts.length > 0) {
          autoGenerateCarouselPDF(postId, assistantMessage.image_prompts);
        } else if (assistantMessage.image_prompt) {
          // Fallback: use single prompt (shouldn't happen, but handle it)
          console.warn("Carousel post has single image_prompt instead of image_prompts array");
          autoGenerateCarouselPDF(postId, [assistantMessage.image_prompt]);
        } else {
          console.error("Carousel post has no image prompts - cannot generate PDF");
        }
      }

      // If this is a new conversation, update URL and notify layout
      if (!conversationId && data.conversation_id) {
        router.push(`/generate?conversation=${data.conversation_id}`);
        window.dispatchEvent(new CustomEvent("conversationCreated"));
      }
    } catch (error: any) {
      console.error("Generation failed:", error);

      // Extract error message
      let errorText = "Sorry, I encountered an error generating your post. Please try again.";
      if (error.response?.data?.detail) {
        errorText = error.response.data.detail;
        // If it's an onboarding error, redirect to onboarding
        if (errorText.includes("onboarding")) {
          errorText = "Please complete onboarding first. Redirecting...";
          setTimeout(() => {
            router.push("/onboarding");
          }, 2000);
        }
      } else if (error.message) {
        errorText = error.message;
      }

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: errorText,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (messageIndex: number) => {
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0) return;

    const userMessage = messages[userMessageIndex].content;
    setLoading(true);

    try {
      const options = {
        post_type: postType,
        tone,
        length,
        hashtag_count: hashtagCount,
      };

      const response = await api.generate.post(
        userMessage,
        options,
        undefined,
        conversationId || undefined
      );
      const data = response.data;

      const newMessage: Message = {
        id: data.id,
        role: "assistant",
        content: data.post_content || data.content,
        post_content: data.post_content,
        format_type: data.format_type || data.format,
        image_prompt: data.image_prompt,
        metadata: data.metadata,
      };

      setMessages((prev) => {
        const updated = [...prev];
        updated[messageIndex] = newMessage;
        return updated;
      });
    } catch (error) {
      console.error("Regeneration failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could use a toast notification here
  };

  const topCreators = [
    { name: "Alex Hormozi", initials: "AH" },
    { name: "Justin Welsh", initials: "JW" },
    { name: "Sahil Bloom", initials: "SB" },
    { name: "Dickie Bush", initials: "DB" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F2F0]">
      {/* Top Banner */}
      <div className="bg-white border-b border-[#E0DFDC] py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <Sparkles className="w-5 h-5 text-[#0A66C2]" />
          <span className="text-sm font-medium text-[#666666]">
            Trained on posts of top LinkedIn creators
          </span>
          <div className="flex -space-x-2">
            {topCreators.map((creator, idx) => (
              <Avatar key={idx} className="w-7 h-7 border-2 border-white">
                <AvatarFallback className="bg-[#0A66C2] text-white text-xs font-semibold">
                  {creator.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Messages */}
        <div className="space-y-6 mb-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-[#E7F3FF] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#0A66C2]" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">
                What would you like to create today?
              </h2>
              <p className="text-[#666666] mb-8">
                Tell me about your topic, and I'll create an engaging LinkedIn post
              </p>
              <div className="max-w-md mx-auto text-left space-y-2">
                <p className="text-sm font-semibold text-[#666666]">Example prompts:</p>
                <div className="space-y-2">
                  {[
                    "Write a post about AI in sales automation",
                    "Create a carousel on leadership best practices",
                    "Share insights on remote team management",
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(example)}
                      className="block w-full text-left px-4 py-3 bg-white border border-[#E0DFDC] rounded-lg hover:border-[#0A66C2] hover:shadow-linkedin-sm transition-all text-sm text-black"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[600px] bg-[#0A66C2] text-white rounded-2xl px-5 py-3 shadow-linkedin-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[700px] w-full space-y-4">
                    {/* LinkedIn Post Preview */}
                    {msg.post_content ? (
                      <LinkedInPostPreview
                        postContent={msg.post_content}
                        formatType={msg.format_type || "text"}
                        imagePrompt={msg.image_prompt}
                        imagePrompts={msg.image_prompts}
                        userProfile={{
                          name: user?.name || "Your Name",
                          headline: "Professional | Content Creator",
                          avatar: user?.linkedin_profile_picture,
                        }}
                        onCopyText={() => copyToClipboard(msg.post_content || msg.content)}
                        onCopyImagePrompt={() => {
                          if (msg.image_prompt) {
                            copyToClipboard(msg.image_prompt);
                          }
                        }}
                        onCopySlidePrompts={() => {
                          if (msg.image_prompts && msg.image_prompts.length > 0) {
                            // Format slide prompts nicely: one per line with slide numbers
                            const formattedPrompts = msg.image_prompts
                              .map((prompt: string, index: number) => `Slide ${index + 1}:\n${prompt}`)
                              .join('\n\n');
                            copyToClipboard(formattedPrompts);
                          }
                        }}
                        onRegenerateImage={async () => {
                          const postId = postIdMap[msg.id] || msg.id;
                          if (!msg.image_prompt) return;

                          setGeneratingImages(prev => ({ ...prev, [postId]: true }));

                          try {
                            const response = await api.images.generateFromPost(postId);
                            const imageData = response.data.image;

                            // Store the current image
                            setCurrentImages(prev => ({
                              ...prev,
                              [postId]: `data:image/png;base64,${imageData}`
                            }));

                            // Reload image history
                            await loadImageHistory(postId);
                          } catch (error: any) {
                            console.error("Image regeneration failed:", error);
                            alert(`Image generation failed: ${error.response?.data?.detail || error.message}`);
                          } finally {
                            setGeneratingImages(prev => ({ ...prev, [postId]: false }));
                          }
                        }}
                        onRegeneratePDF={async () => {
                          const postId = postIdMap[msg.id] || msg.id;
                          if (!msg.image_prompts || msg.image_prompts.length === 0) return;

                          setGeneratingPDFs(prev => ({ ...prev, [postId]: true }));
                          setPdfProgress(prev => ({ ...prev, [postId]: { current: 0, total: msg.image_prompts!.length } }));

                          // Start polling for progress
                          const progressInterval = setInterval(async () => {
                            try {
                              const progressResponse = await api.pdfs.getProgress(postId);
                              const progress = progressResponse.data;
                              setPdfProgress(prev => ({
                                ...prev,
                                [postId]: { current: progress.current || 0, total: progress.total || msg.image_prompts!.length }
                              }));

                              if (progress.completed || progress.status === 'completed') {
                                clearInterval(progressInterval);
                              }
                            } catch (error) {
                              // Ignore progress polling errors
                            }
                          }, 1000); // Poll every second

                          try {
                            const response = await api.pdfs.generateCarousel(postId, msg.image_prompts);
                            const pdfData = response.data.pdf;
                            const slideImages = response.data.slide_images || [];

                            clearInterval(progressInterval);

                            // Store the current PDF
                            setCurrentPDFs(prev => ({
                              ...prev,
                              [postId]: `data:application/pdf;base64,${pdfData}`
                            }));

                            // Store slide images for preview
                            setCurrentPDFSlides(prev => ({
                              ...prev,
                              [postId]: slideImages
                            }));

                            // Load PDF history
                            await loadPdfHistory(postId);
                          } catch (error: any) {
                            clearInterval(progressInterval);
                            console.error("PDF regeneration failed:", error);
                            alert(`PDF regeneration failed: ${error.response?.data?.detail || error.message}`);
                          } finally {
                            setGeneratingPDFs(prev => ({ ...prev, [postId]: false }));
                            setPdfProgress(prev => ({ ...prev, [postId]: { current: msg.image_prompts!.length, total: msg.image_prompts!.length } }));
                          }
                        }}
                        onDownloadPDF={() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          const pdfData = currentPDFs[postId];
                          if (!pdfData) {
                            alert("No PDF generated yet.");
                            return;
                          }

                          // Create download link
                          const link = document.createElement('a');
                          link.href = pdfData;
                          link.download = `linkedin-carousel-${postId}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        onDownloadImage={() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          const imageData = currentImages[postId];
                          if (!imageData) {
                            alert("No image generated yet.");
                            return;
                          }

                          // Create download link
                          const link = document.createElement('a');
                          link.href = imageData;
                          link.download = `linkedin-post-${postId}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        onShowImageHistory={() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          setShowImageHistory(prev => ({ ...prev, [postId]: true }));
                          loadImageHistory(postId);
                        }}
                        onRegenerate={() => handleRegenerate(idx)}
                        onSchedule={() => {
                          // TODO: Open schedule modal
                          alert("Schedule feature coming soon!");
                        }}
                        onPost={() => {
                          // TODO: Open LinkedIn posting flow
                          alert("LinkedIn posting coming soon!");
                        }}
                        currentImage={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return currentImages[postId];
                        })()}
                        currentPDF={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return currentPDFs[postId];
                        })()}
                        currentPDFSlides={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return currentPDFSlides[postId] || [];
                        })()}
                        generatingImage={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return !!generatingImages[postId];
                        })()}
                        generatingPDF={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return !!generatingPDFs[postId];
                        })()}
                        generatingPDFProgress={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return pdfProgress[postId];
                        })()}
                        imageHistory={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return imageHistory[postId] || [];
                        })()}
                        pdfHistory={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return pdfHistory[postId] || [];
                        })()}
                        showImageHistory={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return !!showImageHistory[postId];
                        })()}
                        showPdfHistory={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return !!showPdfHistory[postId];
                        })()}
                        onCloseImageHistory={() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          setShowImageHistory(prev => ({ ...prev, [postId]: false }));
                        }}
                        onClosePdfHistory={() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          setShowPdfHistory(prev => ({ ...prev, [postId]: false }));
                        }}
                        onSelectImage={async (imageId: string) => {
                          const postId = postIdMap[msg.id] || msg.id;
                          try {
                            await api.images.setCurrent(imageId);
                            await loadCurrentImage(postId);
                            await loadImageHistory(postId);
                          } catch (error) {
                            console.error("Failed to set current image:", error);
                          }
                        }}
                        onSelectPDF={async (pdfId: string) => {
                          const postId = postIdMap[msg.id] || msg.id;
                          try {
                            await api.pdfs.setCurrent(pdfId);
                            await loadCurrentPDF(postId);
                            await loadPdfHistory(postId);
                          } catch (error) {
                            console.error("Failed to set current PDF:", error);
                          }
                        }}
                      />
                    ) : (
                      <div className="bg-white rounded-lg px-5 py-3 shadow-linkedin-sm border border-[#E0DFDC]">
                        <p className="text-sm text-black whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    )}

                    {/* Metadata Tags */}
                    {msg.metadata && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 bg-[#F3F2F0] text-[#666666] rounded-full font-medium">
                          {msg.metadata.tone}
                        </span>
                        <span className="px-2.5 py-1 bg-[#F3F2F0] text-[#666666] rounded-full font-medium">
                          {msg.metadata.estimated_engagement} engagement
                        </span>
                        {msg.metadata.hashtags && msg.metadata.hashtags.length > 0 && (
                          <span className="px-2.5 py-1 bg-[#E7F3FF] text-[#0A66C2] rounded-full font-medium">
                            {msg.metadata.hashtags.length} hashtags
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg px-5 py-4 shadow-linkedin-sm border border-[#E0DFDC]">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-[#0A66C2] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#0A66C2] rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-[#0A66C2] rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 pb-6">
          <div className="bg-white rounded-2xl shadow-linkedin-lg border border-[#E0DFDC] overflow-hidden">
            <Textarea
              placeholder="Describe what you want to post about..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={3}
              className="border-0 resize-none focus-visible:ring-0 text-base px-5 py-4"
            />
            <div className="px-4 py-3 bg-[#F9F9F9] border-t border-[#E0DFDC] flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOptions(!showOptions)}
                className="text-[#666666]"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Options
              </Button>
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full px-6"
              >
                <Send className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>

          {/* Options Panel */}
          {showOptions && (
            <div className="mt-3 bg-white rounded-xl shadow-linkedin-md border border-[#E0DFDC] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-black">Generation Options</h3>
                <button
                  onClick={() => setShowOptions(false)}
                  className="p-1 hover:bg-[#F3F2F0] rounded transition-colors"
                >
                  <X className="w-4 h-4 text-[#666666]" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#666666]">Post Type</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="text">Text Only</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="image">Text + Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-[#666666]">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="thought-leader">Thought Leader</SelectItem>
                      <SelectItem value="educator">Educator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-[#666666]">Length</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="long">Long</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-[#666666]">
                    Hashtags: {hashtagCount}
                  </Label>
                  <Slider
                    value={[hashtagCount]}
                    onValueChange={(v) => setHashtagCount(v[0])}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
