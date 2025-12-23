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
  Sparkles,
  CheckCircle2,
  TrendingUp,
  FileText,
  Zap,
  Image,
  Layers,
  Check
} from "lucide-react";
import { api } from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ContextConfigModal } from "@/components/ContextConfigModal";
import { GenerationOptionsMenu } from "@/components/GenerationOptionsMenu";
import { PostTypeMenu } from "@/components/PostTypeMenu";

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
  const [showContextModal, setShowContextModal] = useState(false);
  const [hasContext, setHasContext] = useState(false);
  const [useTrendingTopic, setUseTrendingTopic] = useState(false);
  const [showPostTypeMenu, setShowPostTypeMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const postTypeButtonRef = useRef<HTMLButtonElement>(null);

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
  // Default values
  const DEFAULT_POST_TYPE = "auto";
  const DEFAULT_TONE = "professional";
  const DEFAULT_LENGTH = "medium";
  const DEFAULT_HASHTAG_COUNT = 4;

  // Load saved options from localStorage
  const loadSavedOptions = () => {
    if (typeof window === "undefined") {
      return {
        postType: DEFAULT_POST_TYPE,
        tone: DEFAULT_TONE,
        length: DEFAULT_LENGTH,
        hashtagCount: DEFAULT_HASHTAG_COUNT,
      };
    }

    const saved = localStorage.getItem("generationOptions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          postType: parsed.postType || DEFAULT_POST_TYPE,
          tone: parsed.tone || DEFAULT_TONE,
          length: parsed.length || DEFAULT_LENGTH,
          hashtagCount: parsed.hashtagCount ?? DEFAULT_HASHTAG_COUNT,
        };
      } catch {
        return {
          postType: DEFAULT_POST_TYPE,
          tone: DEFAULT_TONE,
          length: DEFAULT_LENGTH,
          hashtagCount: DEFAULT_HASHTAG_COUNT,
        };
      }
    }
    return {
      postType: DEFAULT_POST_TYPE,
      tone: DEFAULT_TONE,
      length: DEFAULT_LENGTH,
      hashtagCount: DEFAULT_HASHTAG_COUNT,
    };
  };

  const savedOptions = loadSavedOptions();
  const [postType, setPostType] = useState(savedOptions.postType);
  const [tone, setTone] = useState(savedOptions.tone);
  const [length, setLength] = useState(savedOptions.length);
  const [hashtagCount, setHashtagCount] = useState(savedOptions.hashtagCount);
  const [contextTone, setContextTone] = useState<string | null>(null);

  // Save options to localStorage whenever they change
  useEffect(() => {
    const options = {
      postType,
      tone,
      length,
      hashtagCount,
    };
    localStorage.setItem("generationOptions", JSON.stringify(options));
  }, [postType, tone, length, hashtagCount]);

  // Get the effective default tone (from context if available, otherwise fallback)
  const effectiveDefaultTone = contextTone || DEFAULT_TONE;
  
  // Check if options are changed from defaults
  const areOptionsChanged =
    postType !== DEFAULT_POST_TYPE ||
    tone !== effectiveDefaultTone ||
    length !== DEFAULT_LENGTH ||
    hashtagCount !== DEFAULT_HASHTAG_COUNT;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Check if user has context
    checkContext();

    // Load conversation if ID is provided, otherwise clear messages
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const checkContext = async () => {
    try {
      const response = await api.user.getProfile();
      const contextJson = response.data?.context_json;
      setHasContext(!!contextJson && Object.keys(contextJson).length > 0);
      
      // Extract tone from TOON context
      if (contextJson?.tone) {
        let toneFromContext = contextJson.tone.toLowerCase().trim();
        
        // Normalize tone values to match select options
        const toneMap: Record<string, string> = {
          'professional': 'professional',
          'casual': 'casual',
          'thought-leader': 'thought-leader',
          'thought leader': 'thought-leader',
          'educator': 'educator',
          'technical yet accessible': 'professional',
          'engaging': 'casual',
          'storytelling-focused': 'casual',
          'authoritative': 'professional',
          'strategic': 'thought-leader',
          'visionary': 'thought-leader',
        };
        
        // Map to known tone or use as-is if it matches
        const normalizedTone = toneMap[toneFromContext] || toneFromContext;
        
        // Only use if it's one of our valid options
        const validTones = ['professional', 'casual', 'thought-leader', 'educator'];
        if (validTones.includes(normalizedTone)) {
          setContextTone(normalizedTone);
          
          // If user hasn't saved a custom tone preference, use context tone
          const saved = localStorage.getItem("generationOptions");
          if (!saved) {
            setTone(normalizedTone);
          } else {
            try {
              const parsed = JSON.parse(saved);
              // Only update if no tone was saved or if it's still the default
              if (!parsed.tone || parsed.tone === DEFAULT_TONE) {
                setTone(normalizedTone);
              }
            } catch {
              setTone(normalizedTone);
            }
          }
        } else {
          setContextTone(DEFAULT_TONE);
        }
      }
    } catch (error: any) {
      // Silently fail - network errors shouldn't break the UI
      // Only log if it's not a network error (which is expected if backend is down)
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error("Failed to check context:", error);
      }
      setHasContext(false);
    }
  };

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

  const handleInspiration = async () => {
    if (loading) return;

    // User-friendly message to show in UI
    const displayMessage = "I need inspiration";
    // Backend message that triggers random topic generation
    const backendMessage = "Generate me a random post";

    const userMessageObj: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayMessage,
    };

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
        backendMessage, // Send random trigger to backend
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
        image_prompts: data.image_prompts,
        post_id: data.id,
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Store post ID mapping
      setPostIdMap(prev => ({ ...prev, [assistantMessage.id]: data.id }));

      // Auto-generate image/PDF based on format
      if (assistantMessage.format_type === 'image' && assistantMessage.image_prompt) {
        const postId = data.id;
        autoGenerateImage(postId, assistantMessage.image_prompt);
      } else if (assistantMessage.format_type === 'carousel') {
        const postId = data.id;
        if (assistantMessage.image_prompts && assistantMessage.image_prompts.length > 0) {
          autoGenerateCarouselPDF(postId, assistantMessage.image_prompts);
        } else if (assistantMessage.image_prompt) {
          autoGenerateCarouselPDF(postId, [assistantMessage.image_prompt]);
        }
      }

      // If this is a new conversation, update URL
      if (!conversationId && data.conversation_id) {
        router.push(`/generate?conversation=${data.conversation_id}`);
        window.dispatchEvent(new CustomEvent("conversationCreated"));
      }
    } catch (error: any) {
      console.error("Inspiration generation failed:", error);

      let errorText = "Sorry, I encountered an error generating your post. Please try again.";
      if (error.response?.data?.detail) {
        errorText = error.response.data.detail;
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
              <div className="max-w-2xl mx-auto">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                
                {/* Heading */}
                <h2 className="text-3xl font-bold text-black mb-3">
                  Need inspiration?
                </h2>
                
                {/* Description */}
                <p className="text-lg text-[#666666] mb-8 max-w-lg mx-auto leading-relaxed">
                  Let AI generate a unique LinkedIn post tailored to your expertise and style. 
                  Click below to get started instantly.
                </p>
                
                {/* Inspiration Button */}
                <div className="mb-8">
                  <Button
                    onClick={handleInspiration}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-10 py-7 text-lg font-semibold shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate random post for me
                      </>
                    )}
                  </Button>
                </div>

                {/* Post Type Selection Cards */}
                <div className="mb-8">
                  <p className="text-sm text-[#666666] mb-4 text-center">Select post type:</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {[
                      { value: "auto", label: "Choose for me", icon: Zap },
                      { value: "image", label: "Text + Image", icon: Image },
                      { value: "text", label: "Text Only", icon: FileText },
                      { value: "carousel", label: "Carousel", icon: Layers },
                    ].map((type) => {
                      const IconComponent = type.icon;
                      const isSelected = postType === type.value;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setPostType(type.value)}
                          className={`
                            relative w-24 h-24 rounded-xl border-2 transition-all duration-200
                            flex flex-col items-center justify-center gap-2
                            ${isSelected
                              ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-500 shadow-lg scale-105"
                              : "bg-white border-[#E0DFDC] hover:border-purple-300 hover:shadow-md"
                            }
                          `}
                        >
                          <IconComponent
                            className={`w-6 h-6 ${
                              isSelected ? "text-purple-600" : "text-[#666666]"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium text-center px-1 ${
                              isSelected ? "text-purple-600" : "text-[#666666]"
                            }`}
                          >
                            {type.label}
                          </span>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5">
                              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Helper text */}
                <p className="text-sm text-[#999999]">
                  Or type your own topic in the input below
                </p>
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
        <div className="sticky bottom-0 pb-6 z-10">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContextModal(true)}
                  className={`text-[#666666] ${hasContext ? 'hover:bg-green-50' : ''}`}
                >
                  Context
                  {hasContext ? (
                    <CheckCircle2 className="w-4 h-4 ml-2 text-green-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 ml-2 text-gray-400" />
                  )}
                </Button>
                <div ref={postTypeButtonRef} className="inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPostTypeMenu(!showPostTypeMenu)}
                    className={`text-[#666666] hover:bg-[#F3F2F0] ${
                      showPostTypeMenu ? "bg-[#F3F2F0]" : ""
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {postType === "auto" ? "Choose for me" : postType === "text" ? "Text Only" : postType === "carousel" ? "Carousel" : postType === "image" ? "Text + Image" : postType}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseTrendingTopic(!useTrendingTopic)}
                  className={`${
                    useTrendingTopic
                      ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                      : "text-[#666666] hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </Button>
                <div ref={optionsButtonRef} className="inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOptions(!showOptions)}
                    className={`${
                      areOptionsChanged
                        ? "text-purple-600 bg-purple-50 hover:bg-purple-100"
                        : "text-[#666666] hover:bg-purple-50 hover:text-purple-600"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Options
                  </Button>
                </div>
              </div>
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

          {/* Post Type Menu */}
          <PostTypeMenu
            open={showPostTypeMenu}
            onOpenChange={setShowPostTypeMenu}
            postType={postType}
            setPostType={setPostType}
            triggerRef={postTypeButtonRef}
          />

          {/* Generation Options Menu */}
          <GenerationOptionsMenu
            open={showOptions}
            onOpenChange={setShowOptions}
            tone={tone}
            setTone={setTone}
            length={length}
            setLength={setLength}
            hashtagCount={hashtagCount}
            setHashtagCount={setHashtagCount}
            triggerRef={optionsButtonRef}
          />
        </div>

        {/* Context Configuration Modal */}
        <ContextConfigModal
          open={showContextModal}
          onOpenChange={(open) => {
            setShowContextModal(open);
            if (!open) {
              // Refresh context status when modal is closed
              checkContext();
            }
          }}
        />
      </div>
    </div>
  );
}
