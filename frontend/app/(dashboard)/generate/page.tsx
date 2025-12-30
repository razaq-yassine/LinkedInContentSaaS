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
  Check,
  Video,
  Globe
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
import { SlideSelectionModal } from "@/components/SlideSelectionModal";
import TokenUsage from "@/components/TokenUsage";

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
  token_usage?: {
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
    cost?: {
      input_cost: number;
      output_cost: number;
      total_cost: number;
    };
    image_prompt_tokens?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
    image_prompt_cost?: {
      input_cost: number;
      output_cost: number;
      total_cost: number;
    };
    image_prompt_provider?: string;
    image_prompt_model?: string;
    cloudflare_cost?: {
      total_cost: number;
      cost_per_image?: number;
      image_count?: number;
    };
    cloudflare_model?: string;
  };
}

// Utility function to detect and parse JSON content from existing messages
function parseJsonContent(content: string): {
  post_content: string;
  format_type?: string;
  image_prompt?: string;
  image_prompts?: string[];
  metadata?: {
    hashtags?: string[];
    tone?: string;
    estimated_engagement?: string;
  };
} | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  let cleaned = content.trim();
  console.log('🔍 parseJsonContent - Step 1 - Initial:', {
    starts_with: cleaned.substring(0, 50),
    length: cleaned.length,
    has_backticks: cleaned.includes('```')
  });
  
  // Remove markdown code blocks if present
  // Handle ```json ... ``` or ``` ... ```
  // Also handle cases where there might be quotes around it: "```json\n{..."
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    // Remove surrounding quotes
    cleaned = cleaned.slice(1, -1);
    // Unescape newlines and quotes
    cleaned = cleaned.replace(/\\n/g, '\n');
    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.replace(/\\'/g, "'");
    cleaned = cleaned.trim();
    console.log('🔍 Step 2 - After removing quotes:', {
      starts_with: cleaned.substring(0, 50),
      length: cleaned.length
    });
  }
  
  if (cleaned.includes('```')) {
    // Remove opening code block marker (handle both ```json and ```)
    // Use more aggressive regex to handle various formats
    const before = cleaned;
    cleaned = cleaned.replace(/^```json\s*\n?/i, '');
    cleaned = cleaned.replace(/^```\s*\n?/, '');
    // Remove closing code block marker (match at end, possibly with newline before)
    cleaned = cleaned.replace(/\n?```\s*$/m, '');
    // Also remove any trailing ``` that might be on a separate line
    cleaned = cleaned.replace(/\n```\s*$/m, '');
    cleaned = cleaned.trim();
    console.log('🔍 Step 3 - After removing markdown:', {
      before_length: before.length,
      after_length: cleaned.length,
      starts_with: cleaned.substring(0, 50),
      still_has_backticks: cleaned.includes('```')
    });
  }
  
  // Check if it looks like JSON - find the first { and last }
  // This is more robust than regex matching
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  console.log('🔍 Step 4 - Brace positions:', {
    firstBrace,
    lastBrace,
    preview_before: cleaned.substring(0, 100),
    preview_after: cleaned.substring(Math.max(0, cleaned.length - 100))
  });
  
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    console.log('⚠️ No valid JSON braces found:', {
      firstBrace,
      lastBrace,
      preview: cleaned.substring(0, 100)
    });
    return null;
  }
  
  // Extract just the JSON part (from first { to last })
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  
  console.log('🔍 Step 5 - Extracted JSON:', {
    length: cleaned.length,
    first_100: cleaned.substring(0, 100),
    last_100: cleaned.substring(Math.max(0, cleaned.length - 100)),
    has_post_content: cleaned.includes('"post_content"'),
    has_format_type: cleaned.includes('"format_type"')
  });
  
  // Check if it contains JSON-like structure
  if (!cleaned.includes('"post_content"') && !cleaned.includes('"format_type"')) {
    console.log('⚠️ No post_content or format_type found');
    return null;
  }

  try {
    console.log('🔍 Step 6 - Attempting JSON.parse...');
    const parsed = JSON.parse(cleaned);
    console.log('✅ Step 7 - JSON parsed successfully:', {
      has_post_content: !!parsed.post_content,
      format_type: parsed.format_type,
      keys: Object.keys(parsed)
    });
    
    if (typeof parsed !== 'object' || parsed === null) {
      console.log('⚠️ Parsed result is not an object:', typeof parsed);
      return null;
    }

    // Extract post_content
    const post_content = parsed.post_content;
    if (!post_content || typeof post_content !== 'string') {
      console.log('⚠️ post_content is missing or not a string:', {
        has_post_content: !!parsed.post_content,
        type: typeof parsed.post_content,
        keys: Object.keys(parsed)
      });
      return null;
    }

    // Extract other fields
    const result: {
      post_content: string;
      format_type?: string;
      image_prompt?: string;
      image_prompts?: string[];
      metadata?: {
        hashtags?: string[];
        tone?: string;
        estimated_engagement?: string;
      };
    } = {
      post_content: post_content,
    };

    if (parsed.format_type && typeof parsed.format_type === 'string') {
      result.format_type = parsed.format_type;
    }

    if (parsed.image_prompt && typeof parsed.image_prompt === 'string') {
      result.image_prompt = parsed.image_prompt;
    }

    if (parsed.image_prompts && Array.isArray(parsed.image_prompts)) {
      result.image_prompts = parsed.image_prompts;
    }

    if (parsed.metadata && typeof parsed.metadata === 'object') {
      result.metadata = {
        hashtags: parsed.metadata.hashtags || [],
        tone: parsed.metadata.tone,
        estimated_engagement: parsed.metadata.estimated_engagement,
      };
    }

    console.log('✅ Extracted content from JSON:', {
      format_type: result.format_type,
      has_image_prompts: !!result.image_prompts?.length,
      has_metadata: !!result.metadata,
    });

    return result;
  } catch (e: any) {
    // Not valid JSON - this is expected for non-JSON content, so use warn instead of error
    // Only log detailed info if it actually looked like JSON
    const lookedLikeJson = cleaned.includes('"post_content"') || cleaned.includes('"format_type"');
    
    if (lookedLikeJson) {
      console.warn('⚠️ JSON parsing failed in parseJsonContent (will attempt fix):', {
        error: e?.message || String(e) || 'Unknown error',
        error_name: e?.name || 'Unknown',
        cleaned_preview: cleaned.substring(0, 200),
        cleaned_length: cleaned.length
      });
    }
    
    // Try to find and fix common JSON issues
    // The most common issue is unescaped newlines in string values
    try {
      console.log('🔧 Attempting to fix JSON by escaping newlines in strings...');
      
      // Smart fix: escape newlines only inside string values (between quotes)
      let fixed = '';
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        const prevChar = i > 0 ? cleaned[i - 1] : '';
        
        if (escapeNext) {
          fixed += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          fixed += char;
          continue;
        }
        
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
          fixed += char;
          continue;
        }
        
        if (inString) {
          // Inside a string - escape newlines
          if (char === '\n') {
            fixed += '\\n';
          } else if (char === '\r') {
            fixed += '\\r';
          } else {
            fixed += char;
          }
        } else {
          // Outside a string - keep as is
          fixed += char;
        }
      }
      
      console.log('🔧 Fixed JSON preview:', fixed.substring(0, 300));
      const parsedFixed = JSON.parse(fixed);
      
      if (parsedFixed && parsedFixed.post_content) {
        console.log('✅ Successfully fixed and parsed JSON!');
        return {
          post_content: parsedFixed.post_content,
          format_type: parsedFixed.format_type,
          image_prompt: parsedFixed.image_prompt,
          image_prompts: parsedFixed.image_prompts,
          metadata: parsedFixed.metadata,
        };
      }
    } catch (fixError: any) {
      console.log('⚠️ Fix attempt failed:', {
        error: fixError?.message || String(fixError),
        error_name: fixError?.name
      });
    }
    
    return null;
  }
}

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("conversation");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Crafting your post...");
  const [user, setUser] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [hasContext, setHasContext] = useState(false);
  const [showPostTypeMenu, setShowPostTypeMenu] = useState(false);
  const [showMobileButtons, setShowMobileButtons] = useState(false);
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
  const [regeneratingSlideIndex, setRegeneratingSlideIndex] = useState<Record<string, number | null>>({}); // post_id -> slide index being regenerated
  const [showSlideSelectionModal, setShowSlideSelectionModal] = useState<Record<string, boolean>>({}); // post_id -> boolean
  const [currentSlideIndex, setCurrentSlideIndex] = useState<Record<string, number>>({}); // post_id -> current slide index

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
        useTrendingTopic: false,
        internetSearch: false,
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
          useTrendingTopic: parsed.useTrendingTopic ?? false,
          internetSearch: parsed.internetSearch ?? false,
        };
      } catch {
        return {
          postType: DEFAULT_POST_TYPE,
          tone: DEFAULT_TONE,
          length: DEFAULT_LENGTH,
          hashtagCount: DEFAULT_HASHTAG_COUNT,
          useTrendingTopic: false,
          internetSearch: false,
        };
      }
    }
    return {
      postType: DEFAULT_POST_TYPE,
      tone: DEFAULT_TONE,
      length: DEFAULT_LENGTH,
      hashtagCount: DEFAULT_HASHTAG_COUNT,
      useTrendingTopic: false,
      internetSearch: false,
    };
  };

  const savedOptions = loadSavedOptions();
  const [postType, setPostType] = useState(savedOptions.postType);
  const [tone, setTone] = useState(savedOptions.tone);
  const [length, setLength] = useState(savedOptions.length);
  const [hashtagCount, setHashtagCount] = useState(savedOptions.hashtagCount);
  const [useTrendingTopic, setUseTrendingTopic] = useState(savedOptions.useTrendingTopic);
  const [internetSearch, setInternetSearch] = useState(savedOptions.internetSearch);
  const [contextTone, setContextTone] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<any>(null);

  // Save options to localStorage whenever they change
  useEffect(() => {
    const options = {
      postType,
      tone,
      length,
      hashtagCount,
      useTrendingTopic,
      internetSearch,
    };
    localStorage.setItem("generationOptions", JSON.stringify(options));
  }, [postType, tone, length, hashtagCount, useTrendingTopic, internetSearch]);

  // Get the effective default tone (from context if available, otherwise fallback)
  const effectiveDefaultTone = contextTone || DEFAULT_TONE;

  // Check if options are changed from defaults (excluding postType which is managed separately)
  const areOptionsChanged =
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
      const uiMessages: Message[] = conversation.messages.map((msg: any) => {
        // Safeguard: Check if content is JSON and extract all fields if needed
        let content = msg.content;
        let formatType = msg.format;
        let imagePrompt = msg.image_prompt;
        let imagePrompts = msg.image_prompts;
        let metadata = msg.metadata;
        let tokenUsage = msg.token_usage; // Include token_usage from backend
        
        // Use the parseJsonContent utility function
        if (typeof content === 'string' && content.trim().length > 0) {
          const trimmed = content.trim();
          // Only try to parse if it looks like JSON (for assistant messages)
          if (msg.role === 'assistant' && (trimmed.startsWith('{') || trimmed.startsWith('```') || trimmed.includes('"post_content"'))) {
            try {
              const parsed = parseJsonContent(content);
              if (parsed && parsed.post_content) {
                content = parsed.post_content;
                formatType = parsed.format_type || formatType;
                imagePrompt = parsed.image_prompt || imagePrompt;
                imagePrompts = parsed.image_prompts || imagePrompts;
                metadata = parsed.metadata || metadata;
                console.log("✅ Extracted content from JSON in conversation message:", {
                  format_type: formatType,
                  has_image_prompts: !!imagePrompts?.length,
                  has_metadata: !!metadata
                });
              }
            } catch (parseError: any) {
              // If parsing fails, just use the original content
              console.warn("⚠️ Failed to parse JSON content in loadConversation:", {
                error: parseError?.message || String(parseError),
                message_id: msg.id,
                role: msg.role
              });
            }
          }
        }
        
        return {
        id: msg.id,
        role: msg.role, // "user" or "assistant"
          content: content,
          post_content: msg.role === "assistant" ? content : undefined,
          format_type: formatType,
          image_prompt: imagePrompt,
          image_prompts: imagePrompts, // For carousel posts
        post_id: msg.post_id, // Post ID from backend
          metadata: metadata,
          token_usage: tokenUsage, // Include token_usage from backend
        };
      });
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
    } catch (error: any) {
      // Only log if it's not a network error (backend might be down)
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error("Failed to load conversation:", error);
      }
      // Silently fail for network errors - backend might not be running
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
      // Sort by created_at descending (newest first) to ensure correct order
      const sortedImages = [...response.data.images].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Descending order (newest first)
      });
      setImageHistory(prev => ({
        ...prev,
        [postId]: sortedImages.map((img: any) => ({
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
        // Sort by created_at descending (newest first) to ensure correct order
        const sortedPdfs = [...response.data.pdfs].sort((a: any, b: any) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
        setPdfHistory(prev => ({
          ...prev,
          [postId]: sortedPdfs.map((pdf: any) => ({
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
    setLoadingMessage("Crafting your post...");

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
      setLoadingMessage("Crafting your post..."); // Reset to default
    }
  };

  // Parse user prompt for length and hashtag preferences
  const parsePromptPreferences = (userMessage: string) => {
    const messageLower = userMessage.toLowerCase();

    // Parse length preferences
    let parsedLength = length; // Default to current setting
    if (messageLower.includes('long') || messageLower.includes('lengthy') || messageLower.includes('extended')) {
      parsedLength = 'long';
    } else if (messageLower.includes('short') || messageLower.includes('brief') || messageLower.includes('concise')) {
      parsedLength = 'short';
    } else if (messageLower.includes('medium') || messageLower.includes('moderate')) {
      parsedLength = 'medium';
    }

    // Parse hashtag count preferences
    let parsedHashtagCount = hashtagCount; // Default to current setting

    // Look for explicit hashtag count requests
    const hashtagPatterns = [
      /(\d+)\s*hashtags?/i,
      /hashtags?.*?(\d+)/i,
      /(\d+)\s*tags?/i,
      /tags?.*?(\d+)/i,
      /more\s+hashtags?/i,
      /add\s+more\s+hashtags?/i,
      /include\s+more\s+hashtags?/i,
      /extra\s+hashtags?/i,
      /fewer\s+hashtags?/i,
      /less\s+hashtags?/i,
      /no\s+hashtags?/i,
      /without\s+hashtags?/i,
    ];

    for (const pattern of hashtagPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        if (match[1]) {
          // Found explicit number
          const count = parseInt(match[1], 10);
          if (!isNaN(count) && count >= 0 && count <= 10) {
            parsedHashtagCount = count;
            break;
          }
        } else if (pattern.source.includes('more') || pattern.source.includes('add') || pattern.source.includes('include') || pattern.source.includes('extra')) {
          // User wants more hashtags - increase by 2-3
          parsedHashtagCount = Math.min(10, hashtagCount + 3);
          break;
        } else if (pattern.source.includes('fewer') || pattern.source.includes('less')) {
          // User wants fewer hashtags - decrease by 1-2
          parsedHashtagCount = Math.max(0, hashtagCount - 2);
          break;
        } else if (pattern.source.includes('no') || pattern.source.includes('without')) {
          // User wants no hashtags
          parsedHashtagCount = 0;
          break;
        }
      }
    }

    return {
      length: parsedLength,
      hashtag_count: parsedHashtagCount,
    };
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

    // Set initial loading message based on web search status
    const isWebSearchEnabled = useTrendingTopic || internetSearch;
    if (isWebSearchEnabled) {
      setLoadingMessage("Searching on the web...");
      // After 3 seconds, switch to crafting message
      // Note: We don't check loading state here since the timeout is short
      // and the message update is harmless even if loading stopped
      setTimeout(() => {
        setLoadingMessage("Crafting your post...");
      }, 3000);
    } else {
      setLoadingMessage("Crafting your post...");
    }

    try {
      // Parse user prompt for preferences (overrides current settings)
      const promptPreferences = parsePromptPreferences(userMessage);

      const options = {
        post_type: postType,
        tone,
        length: promptPreferences.length, // Use parsed length (prompt has priority)
        hashtag_count: promptPreferences.hashtag_count, // Use parsed hashtag count (prompt has priority)
        use_trending_topic: useTrendingTopic,
        use_web_search: internetSearch,
      };

      const response = await api.generate.post(
        userMessage,
        options,
        undefined,
        conversationId || undefined
      );
      const data = response.data;

      // Capture token usage
      if (data.token_usage) {
        setTokenUsage(data.token_usage);
      }

      // Safeguard: Extract actual post_content if it's a JSON string
      let postContent = data.post_content || data.content;
      if (typeof postContent === 'string' && postContent.trim().startsWith('{') && postContent.includes('"post_content"')) {
        try {
          const parsed = JSON.parse(postContent);
          if (parsed && typeof parsed === 'object' && parsed.post_content) {
            postContent = parsed.post_content;
            console.log("Extracted post_content from JSON string in frontend");
          }
        } catch (e) {
          // If parsing fails, keep original postContent
          console.warn("Failed to parse post_content JSON string:", e);
        }
      }

      const assistantMessage: Message = {
        id: data.id,
        role: "assistant",
        content: postContent,
        post_content: postContent,
        format_type: data.format_type || data.format,
        image_prompt: data.image_prompt,
        image_prompts: data.image_prompts, // For carousel posts
        post_id: data.id, // Post ID is the same as the response ID
        metadata: data.metadata,
        token_usage: data.token_usage,
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
      setLoadingMessage("Crafting your post..."); // Reset to default
    }
  };

  const handleRegenerate = async (messageIndex: number) => {
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0) return;

    const userMessage = messages[userMessageIndex].content;
    setLoading(true);
    setLoadingMessage("Crafting your post...");

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
        token_usage: data.token_usage,
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
    { name: "Alex Hormozi", initials: "AH", image: "/creators/alex-hormozi.jpg" },
    { name: "Justin Welsh", initials: "JW", image: "/creators/justin-welsh.jpg" },
    { name: "Sahil Bloom", initials: "SB", image: "/creators/sahil-bloom.jpg" },
    { name: "Dickie Bush", initials: "DB", image: "/creators/dickie-bush.jpg" },
  ];

  return (
    <>
      <TokenUsage tokenUsage={tokenUsage} />
      <div className="min-h-screen bg-[#F3F2F0]">
      {/* Top Banner - Only show when no conversation */}
      {messages.length === 0 && (
        <div className="bg-white border-b border-[#E0DFDC] py-2 sm:py-3 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-3">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#0A66C2] flex-shrink-0" />
            <span className="text-xs sm:text-base font-medium text-[#666666]">
            Trained on posts of top LinkedIn creators
          </span>
          <div className="flex -space-x-2">
            {topCreators.map((creator, idx) => (
                <Avatar key={idx} className="w-7 h-7 sm:w-9 sm:h-9 border-2 border-white">
                <AvatarImage src={creator.image} alt={creator.name} />
                  <AvatarFallback className="bg-[#0A66C2] text-white text-[10px] sm:text-xs font-semibold">
                  {creator.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className={`max-w-4xl mx-auto px-3 sm:px-4 ${messages.length === 0 ? 'h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)]' : 'h-[calc(100vh-40px)] sm:h-[calc(100vh-60px)]'} flex flex-col`}>
        {/* Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 py-4 sm:py-8 pb-4 pr-1 sm:pr-2">
          {messages.length === 0 && (
            <div className="text-center py-10 sm:py-20 px-2">
              <div className="max-w-2xl mx-auto">
                {/* Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
                </div>

                {/* Heading */}
                <h2 className="text-2xl sm:text-3xl font-bold text-black mb-2 sm:mb-3">
                  Need inspiration?
                </h2>

                {/* Description */}
                <p className="text-base sm:text-lg text-[#666666] mb-6 sm:mb-8 max-w-lg mx-auto leading-relaxed px-2">
                  Let AI generate a unique LinkedIn post tailored to your expertise and style.
                  Click below to get started instantly.
                </p>

                {/* Post Type Selection Cards */}
                <div className="mb-4 sm:mb-6 px-2">
                  <p className="text-xs sm:text-sm text-[#666666] mb-3 sm:mb-4 text-center">Content type:</p>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    {[
                      { value: "auto", label: "Choose for me", icon: Zap },
                      { value: "image", label: "Text + Image", icon: Image },
                      { value: "text", label: "Text Only", icon: FileText },
                      { value: "carousel", label: "Carousel", icon: Layers },
                      { value: "video_script", label: "Video script", icon: Video },
                    ].map((type) => {
                      const IconComponent = type.icon;
                      const isSelected = postType === type.value;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setPostType(type.value)}
                          className={`
                            relative w-16 h-16 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl border-2 transition-all duration-200
                            flex flex-col items-center justify-center gap-1 sm:gap-2
                            ${isSelected
                              ? "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-500 shadow-lg scale-105"
                              : "bg-white border-[#E0DFDC] hover:border-purple-300 hover:shadow-md"
                            }
                          `}
                        >
                          <IconComponent
                            className={`w-4 h-4 sm:w-6 sm:h-6 ${isSelected ? "text-purple-600" : "text-[#666666]"
                              }`}
                          />
                          <span
                            className={`text-[10px] sm:text-xs font-medium text-center px-1 leading-tight ${isSelected ? "text-purple-600" : "text-[#666666]"
                              }`}
                          >
                            {type.label}
                          </span>
                          {isSelected && (
                            <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5">
                              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inspiration Button */}
                <div className="mb-4 sm:mb-6 px-2">
                  <Button
                    onClick={handleInspiration}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full px-6 py-5 sm:px-10 sm:py-7 text-base sm:text-lg font-semibold shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Generate random post for me
                      </>
                    )}
                  </Button>
                </div>

                {/* Helper text */}
                <p className="text-xs sm:text-sm text-[#999999] px-2">
                  Or type your own topic in the input below
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            // Check if content is JSON and extract data if needed
            let displayContent = msg.post_content || msg.content;
            let displayFormatType = msg.format_type;
            let displayImagePrompt = msg.image_prompt;
            let displayImagePrompts = msg.image_prompts;
            let displayMetadata = msg.metadata;

            // ALWAYS check if content or post_content is JSON and try to parse it
            // This handles cases where JSON was stored in the database
            const contentToCheck = msg.post_content || msg.content;
            if (typeof contentToCheck === 'string' && contentToCheck.trim().length > 0) {
              const trimmed = contentToCheck.trim();
              
              // More aggressive check: if it contains JSON-like structure, try to parse
              const looksLikeJson = trimmed.startsWith('{') || 
                                   trimmed.startsWith('```') ||
                                   trimmed.startsWith('"```') ||
                                   (trimmed.includes('"post_content"') && (trimmed.includes('"format_type"') || trimmed.includes('format_type')));
              
              if (looksLikeJson) {
                console.log('🔍 Attempting to parse JSON content:', {
                  starts_with: trimmed.substring(0, 50),
                  length: trimmed.length
                });
                
                const parsed = parseJsonContent(contentToCheck);
                if (parsed && parsed.post_content && parsed.post_content.trim().length > 0) {
                  console.log('✅ Successfully parsed JSON content:', {
                    original_length: contentToCheck.length,
                    extracted_content_length: parsed.post_content.length,
                    format_type: parsed.format_type,
                    has_image_prompts: !!parsed.image_prompts?.length,
                    has_metadata: !!parsed.metadata
                  });
                  displayContent = parsed.post_content;
                  displayFormatType = parsed.format_type || displayFormatType;
                  displayImagePrompt = parsed.image_prompt || displayImagePrompt;
                  displayImagePrompts = parsed.image_prompts || displayImagePrompts;
                  displayMetadata = parsed.metadata || displayMetadata;
                } else {
                  console.warn('⚠️ Failed to parse JSON content:', {
                    starts_with: trimmed.substring(0, 100),
                    length: trimmed.length,
                    has_post_content_key: trimmed.includes('"post_content"'),
                    parsed_result: parsed
                  });
                }
              }
            }

            return (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[600px] bg-[#0A66C2] text-white rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-linkedin-sm">
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                    <div className="max-w-[95%] sm:max-w-[700px] w-full space-y-3 sm:space-y-4">
                    {/* LinkedIn Post Preview */}
                      {displayContent ? (
                      <LinkedInPostPreview
                          postContent={displayContent}
                          formatType={displayFormatType || "text"}
                          imagePrompt={displayImagePrompt}
                          imagePrompts={displayImagePrompts}
                        userProfile={{
                          name: user?.name || "Your Name",
                          headline: "Professional | Content Creator",
                          avatar: user?.linkedin_profile_picture,
                        }}
                        onCopyText={() => copyToClipboard(displayContent)}
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

                            // Update token usage with Cloudflare cost if provided
                            console.log("DEBUG: Image regeneration response:", {
                              has_cloudflare_cost: !!response.data.cloudflare_cost,
                              cloudflare_cost: response.data.cloudflare_cost,
                              current_msg_token_usage: msg.token_usage
                            });
                            
                            if (response.data.cloudflare_cost) {
                              setMessages(prev => prev.map(m => {
                                if (m.id === msg.id) {
                                  const updated = {
                                    ...m,
                                    token_usage: {
                                      ...(m.token_usage || {}),
                                      cloudflare_cost: response.data.cloudflare_cost
                                    }
                                  };
                                  console.log("DEBUG: Updated message:", {
                                    id: updated.id,
                                    cloudflare_cost: updated.token_usage?.cloudflare_cost
                                  });
                                  return updated;
                                }
                                return m;
                              }));
                            } else {
                              console.warn("DEBUG: No cloudflare_cost in response");
                            }

                            // Reload image history
                            await loadImageHistory(postId);
                          } catch (error: any) {
                            console.error("Image regeneration failed:", error);
                            alert(`Image generation failed: ${error.response?.data?.detail || error.message}`);
                          } finally {
                            setGeneratingImages(prev => ({ ...prev, [postId]: false }));
                          }
                        }}
                        onRegeneratePDF={async (slideIndices?: number[]) => {
                          const postId = postIdMap[msg.id] || msg.id;
                          if (!msg.image_prompts || msg.image_prompts.length === 0) return;

                          // If no slide indices provided or empty array, show selection modal
                          // Also handle case where event object might be passed instead of undefined
                          if (slideIndices === undefined || slideIndices === null || !Array.isArray(slideIndices) || slideIndices.length === 0) {
                            setShowSlideSelectionModal(prev => ({ ...prev, [postId]: true }));
                            return;
                          }

                          // Determine prompts to use based on slide indices
                          const promptsToRegenerate = slideIndices.length === msg.image_prompts.length
                            ? msg.image_prompts // Regenerate all
                            : slideIndices.map(idx => msg.image_prompts![idx]);

                          setGeneratingPDFs(prev => ({ ...prev, [postId]: true }));
                          setPdfProgress(prev => ({ ...prev, [postId]: { current: 0, total: promptsToRegenerate.length } }));

                          // Start polling for progress
                          const progressInterval = setInterval(async () => {
                            try {
                              const progressResponse = await api.pdfs.getProgress(postId);
                              const progress = progressResponse.data;
                              setPdfProgress(prev => ({
                                ...prev,
                                [postId]: { current: progress.current || 0, total: progress.total || promptsToRegenerate.length }
                              }));

                              if (progress.completed || progress.status === 'completed') {
                                clearInterval(progressInterval);
                              }
                            } catch (error) {
                              // Ignore progress polling errors
                            }
                          }, 1000); // Poll every second

                          try {
                            const response = await api.pdfs.generateCarousel(
                              postId,
                              promptsToRegenerate,
                              slideIndices.length === msg.image_prompts.length ? undefined : slideIndices
                            );
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

                            // Update token usage with Cloudflare cost if provided
                            if (response.data.cloudflare_cost) {
                              setMessages(prev => prev.map(m => {
                                if (m.id === msg.id) {
                                  return {
                                    ...m,
                                    token_usage: {
                                      ...(m.token_usage || {}),
                                      cloudflare_cost: response.data.cloudflare_cost
                                    }
                                  };
                                }
                                return m;
                              }));
                            }

                            // Load PDF history
                            await loadPdfHistory(postId);
                          } catch (error: any) {
                            clearInterval(progressInterval);
                            console.error("PDF regeneration failed:", error);
                            alert(`PDF regeneration failed: ${error.response?.data?.detail || error.message}`);
                          } finally {
                            setGeneratingPDFs(prev => ({ ...prev, [postId]: false }));
                            setPdfProgress(prev => ({ ...prev, [postId]: { current: promptsToRegenerate.length, total: promptsToRegenerate.length } }));
                          }
                        }}
                        onRegenerateSlide={async (slideIndex: number) => {
                          const postId = postIdMap[msg.id] || msg.id;
                          if (!msg.image_prompts || msg.image_prompts.length === 0) return;
                          if (slideIndex < 0 || slideIndex >= msg.image_prompts.length) return;

                          // Store the current slide index before regeneration
                          const slideIndexToMaintain = slideIndex;

                          // Set regenerating state for this specific slide
                          setRegeneratingSlideIndex(prev => ({ ...prev, [postId]: slideIndex }));

                          try {
                            const promptForSlide = msg.image_prompts[slideIndex];
                            const response = await api.pdfs.generateCarousel(
                              postId,
                              [promptForSlide],
                              [slideIndex]
                            );
                            const slideImages = response.data.slide_images || [];

                            // Replace ALL slides with the new PDF slides (backend returns all slides)
                            if (slideImages.length > 0) {
                              // Update slide index FIRST to ensure CarouselSlider receives correct initialSlide
                              setCurrentSlideIndex(prev => ({
                                ...prev,
                                [postId]: slideIndexToMaintain
                              }));

                              // Then update slides - this will trigger CarouselSlider to use the updated initialSlide
                              setCurrentPDFSlides(prev => ({
                                ...prev,
                                [postId]: slideImages
                              }));
                            }

                            // Also update PDF
                            const pdfData = response.data.pdf;
                            setCurrentPDFs(prev => ({
                              ...prev,
                              [postId]: `data:application/pdf;base64,${pdfData}`
                            }));

                            // Reload PDF history
                            await loadPdfHistory(postId);
                          } catch (error: any) {
                            console.error("Slide regeneration failed:", error);
                            alert(`Slide regeneration failed: ${error.response?.data?.detail || error.message}`);
                          } finally {
                            // Clear regenerating state
                            setRegeneratingSlideIndex(prev => ({ ...prev, [postId]: null }));
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
                        onShowPdfHistory={() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          setShowPdfHistory(prev => ({ ...prev, [postId]: true }));
                          loadPdfHistory(postId);
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
                        regeneratingSlideIndex={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return regeneratingSlideIndex[postId] ?? null;
                        })()}
                        currentSlideIndex={(() => {
                          const postId = postIdMap[msg.id] || msg.id;
                          return currentSlideIndex[postId] ?? 0;
                        })()}
                        onSlideChange={(slideIndex: number) => {
                          const postId = postIdMap[msg.id] || msg.id;
                          setCurrentSlideIndex(prev => ({ ...prev, [postId]: slideIndex }));
                        }}
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
                          {displayContent}
                        </p>
                      </div>
                    )}

                    {/* Token Usage Display */}
                    {msg.token_usage && (
                      <div className="space-y-2">
                        {/* Main Generation Tokens */}
                        <div className="flex items-center gap-3 text-xs bg-[#F9F9F9] px-3 py-2 rounded-lg border border-[#E0DFDC]">
                          <div className="flex items-center gap-1">
                            <span className="text-[#666666] font-medium">Tokens:</span>
                            <span className="font-mono font-semibold text-[#0A66C2]">
                              {msg.token_usage.total_tokens.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[#666666]">Input:</span>
                            <span className="font-mono text-green-600 font-medium">
                              {msg.token_usage.input_tokens.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[#666666]">Output:</span>
                            <span className="font-mono text-orange-600 font-medium">
                              {msg.token_usage.output_tokens.toLocaleString()}
                            </span>
                          </div>
                          {msg.token_usage.cost && (
                            <div className="flex items-center gap-1">
                              <span className="text-[#666666]">Cost:</span>
                              <span className="font-mono text-purple-600 font-medium">
                                ${msg.token_usage.cost.total_cost.toFixed(6)}
                              </span>
                            </div>
                          )}
                          {msg.token_usage.provider && (
                            <div className="flex items-center gap-1 ml-auto">
                              <span className="text-[#666666] text-[10px]">
                                {msg.token_usage.provider.charAt(0).toUpperCase() + msg.token_usage.provider.slice(1)}
                                {msg.token_usage.model && ` (${msg.token_usage.model})`}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Image Prompt Generation Tokens (Separate Provider) */}
                        {msg.token_usage.image_prompt_tokens && (
                          <div className="flex items-center gap-3 text-xs bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-1">
                              <span className="text-[#666666] font-medium">Image Prompts:</span>
                              <span className="font-mono font-semibold text-blue-600">
                                {msg.token_usage.image_prompt_tokens.total_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[#666666]">Input:</span>
                              <span className="font-mono text-green-600 font-medium">
                                {msg.token_usage.image_prompt_tokens.input_tokens.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[#666666]">Output:</span>
                              <span className="font-mono text-orange-600 font-medium">
                                {msg.token_usage.image_prompt_tokens.output_tokens.toLocaleString()}
                              </span>
                            </div>
                            {msg.token_usage.image_prompt_cost && (
                              <div className="flex items-center gap-1">
                                <span className="text-[#666666]">Cost:</span>
                                <span className="font-mono text-purple-600 font-medium">
                                  ${msg.token_usage.image_prompt_cost.total_cost.toFixed(6)}
                                </span>
                              </div>
                            )}
                            {msg.token_usage.image_prompt_provider && (
                              <div className="flex items-center gap-1 ml-auto">
                                <span className="text-[#666666] text-[10px]">
                                  {msg.token_usage.image_prompt_provider.charAt(0).toUpperCase() + msg.token_usage.image_prompt_provider.slice(1)}
                                  {msg.token_usage.image_prompt_model && ` (${msg.token_usage.image_prompt_model})`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Cloudflare Image Generation Cost (Separate Provider) */}
                        {msg.token_usage.cloudflare_cost && (
                          <div className="flex items-center gap-3 text-xs bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                            <div className="flex items-center gap-1">
                              <span className="text-[#666666] font-medium">Image Generation:</span>
                              <span className="font-mono font-semibold text-purple-600">
                                {msg.token_usage.cloudflare_cost.image_count || 1} image{(msg.token_usage.cloudflare_cost.image_count || 1) > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[#666666]">Cost:</span>
                              <span className="font-mono text-purple-600 font-medium">
                                ${msg.token_usage.cloudflare_cost.total_cost.toFixed(6)}
                              </span>
                            </div>
                            {msg.token_usage.cloudflare_cost.cost_per_image && (
                              <div className="flex items-center gap-1">
                                <span className="text-[#666666] text-[10px]">(${msg.token_usage.cloudflare_cost.cost_per_image.toFixed(6)}/image)</span>
                              </div>
                            )}
                            {msg.token_usage.cloudflare_model && (
                              <div className="flex items-center gap-1 ml-auto">
                                <span className="text-[#666666] text-[10px]">
                                  Cloudflare ({msg.token_usage.cloudflare_model.replace('@cf/leonardo/', '').replace('@cf/', '')})
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg px-4 py-3 sm:px-5 sm:py-4 shadow-linkedin-sm border border-[#E0DFDC]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-[#0A66C2] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#0A66C2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#0A66C2] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-[#666666] font-medium">{loadingMessage}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at Bottom */}
        <div className="flex-shrink-0 pt-4 sm:pt-6 pb-4 sm:pb-6 z-10 bg-[#F3F2F0]">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-linkedin-lg border border-[#E0DFDC] overflow-hidden">
            <Textarea
              placeholder="Describe what you want to post about..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (e.target.value.trim()) {
                  setShowMobileButtons(true);
                }
              }}
              onFocus={() => setShowMobileButtons(true)}
              onClick={() => setShowMobileButtons(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={3}
              className="border-0 resize-none focus-visible:ring-0 text-sm sm:text-base px-4 py-3 sm:px-5 sm:py-4"
            />
            <div className={`px-3 py-2 sm:px-4 sm:py-3 bg-[#F9F9F9] border-t border-[#E0DFDC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 ${showMobileButtons ? 'flex' : 'hidden sm:flex'}`}>
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContextModal(true)}
                  className={`${hasContext ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'text-[#666666] hover:bg-green-50'} text-xs sm:text-sm px-2 sm:px-3`}
                >
                  Context
                  {hasContext ? (
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-green-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 text-gray-400 flex-shrink-0" />
                  )}
                </Button>
                <div ref={postTypeButtonRef} className="inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPostTypeMenu(!showPostTypeMenu)}
                    className={`text-[#666666] hover:bg-[#F3F2F0] ${showPostTypeMenu ? "bg-[#F3F2F0]" : ""
                      } text-xs sm:text-sm px-2 sm:px-3`}
                  >
                    {(() => {
                      const iconMap: Record<string, typeof FileText> = {
                        auto: Zap,
                        image: Image,
                        text: FileText,
                        carousel: Layers,
                        video_script: Video,
                      };
                      const IconComponent = iconMap[postType] || FileText;
                      return <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />;
                    })()}
                    {postType === "auto" ? "Choose for me" : postType === "text" ? "Text Only" : postType === "carousel" ? "Carousel" : postType === "image" ? "Text + Image" : postType === "video_script" ? "Video script" : postType}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newTrendingState = !useTrendingTopic;
                    setUseTrendingTopic(newTrendingState);
                    // Auto-enable web search when Trending is toggled on
                    if (newTrendingState) {
                      setInternetSearch(true);
                    }
                    // When Trending is toggled off, web search remains on (don't auto-disable)
                  }}
                  className={`${useTrendingTopic
                    ? "text-orange-600 bg-orange-50 hover:bg-orange-100"
                    : "text-[#666666] hover:bg-orange-50 hover:text-orange-600"
                    } text-xs sm:text-sm px-2 sm:px-3`}
                >
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  Trending
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInternetSearch(!internetSearch)}
                  className={`${internetSearch
                    ? "text-green-600 bg-green-50 hover:bg-green-100"
                    : "text-[#666666] hover:bg-green-50 hover:text-green-600"
                    } text-xs sm:text-sm px-2 sm:px-3`}
                >
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  Web Search
                </Button>
                <div ref={optionsButtonRef} className="inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOptions(!showOptions)}
                    className={`${areOptionsChanged
                      ? "text-purple-600 bg-purple-50 hover:bg-purple-100"
                      : "text-[#666666] hover:bg-purple-50 hover:text-purple-600"
                      } text-xs sm:text-sm px-2 sm:px-3`}
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                    Options
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full px-4 sm:px-6 text-xs sm:text-sm sm:text-base whitespace-nowrap"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                Generate
              </Button>
            </div>
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

        {/* Slide Selection Modals */}
        {messages.map((msg) => {
          const postId = postIdMap[msg.id] || msg.id;
          const isOpen = showSlideSelectionModal[postId] || false;
          const slides = currentPDFSlides[postId] || [];
          const prompts = msg.image_prompts || [];

          if (msg.format_type !== 'carousel' || !isOpen || slides.length === 0) {
            return null;
          }

          return (
            <SlideSelectionModal
              key={`slide-modal-${postId}`}
              isOpen={isOpen}
              onClose={() => setShowSlideSelectionModal(prev => ({ ...prev, [postId]: false }))}
              slides={slides}
              prompts={prompts}
              onConfirm={(selectedIndices) => {
                setShowSlideSelectionModal(prev => ({ ...prev, [postId]: false }));
                // Trigger regeneration with selected indices
                const regenerateHandler = async () => {
                  const postId = postIdMap[msg.id] || msg.id;
                  if (!msg.image_prompts || msg.image_prompts.length === 0) return;

                  const promptsToRegenerate = selectedIndices.length === msg.image_prompts.length
                    ? msg.image_prompts
                    : selectedIndices.map(idx => msg.image_prompts![idx]);

                  setGeneratingPDFs(prev => ({ ...prev, [postId]: true }));
                  setPdfProgress(prev => ({ ...prev, [postId]: { current: 0, total: promptsToRegenerate.length } }));

                  const progressInterval = setInterval(async () => {
                    try {
                      const progressResponse = await api.pdfs.getProgress(postId);
                      const progress = progressResponse.data;
                      setPdfProgress(prev => ({
                        ...prev,
                        [postId]: { current: progress.current || 0, total: progress.total || promptsToRegenerate.length }
                      }));

                      if (progress.completed || progress.status === 'completed') {
                        clearInterval(progressInterval);
                      }
                    } catch (error) {
                      // Ignore progress polling errors
                    }
                  }, 1000);

                  try {
                    const response = await api.pdfs.generateCarousel(
                      postId,
                      promptsToRegenerate,
                      selectedIndices.length === msg.image_prompts.length ? undefined : selectedIndices
                    );
                    const pdfData = response.data.pdf;
                    const slideImages = response.data.slide_images || [];

                    clearInterval(progressInterval);

                    setCurrentPDFs(prev => ({
                      ...prev,
                      [postId]: `data:application/pdf;base64,${pdfData}`
                    }));

                    setCurrentPDFSlides(prev => ({
                      ...prev,
                      [postId]: slideImages
                    }));

                    await loadPdfHistory(postId);
                  } catch (error: any) {
                    clearInterval(progressInterval);
                    console.error("PDF regeneration failed:", error);
                    alert(`PDF regeneration failed: ${error.response?.data?.detail || error.message}`);
                  } finally {
                    setGeneratingPDFs(prev => ({ ...prev, [postId]: false }));
                    setPdfProgress(prev => ({ ...prev, [postId]: { current: promptsToRegenerate.length, total: promptsToRegenerate.length } }));
                  }
                };
                regenerateHandler();
              }}
            />
          );
        })}
    </div>
    </>
  );
}
