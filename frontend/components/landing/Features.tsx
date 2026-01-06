"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Sparkles, 
  Calendar, 
  Mic, 
  FileText, 
  Target,
  TrendingUp,
  Clock,
  Brain,
  Palette,
  MessageSquare,
  Cpu,
  Zap,
  Activity,
  Send,
  Lightbulb
} from "lucide-react";

const mainFeatures = [
  {
    icon: Brain,
    title: "Neural Voice Matching",
    description: "Our AI uses deep learning to analyze your writing patterns, vocabulary, and tone. It creates a unique voice fingerprint that achieves 95% authenticity.",
    gradient: "from-violet-500 to-purple-500",
    glowColor: "violet",
    badge: "Deep Learning",
    stats: "95% accuracy",
  },
  {
    icon: TrendingUp,
    title: "Algorithm-Optimized Content",
    description: "Trained on millions of viral LinkedIn posts, our AI understands exactly what the algorithm rewards and crafts content for maximum reach.",
    gradient: "from-cyan-500 to-blue-500",
    glowColor: "cyan",
    badge: "ML Insights",
    stats: "3x more reach",
  },
  {
    icon: Cpu,
    title: "10x Faster Creation",
    description: "What used to take hours now takes minutes. Our GPT-5 & Claude powered engine generates, refines, and optimizes content instantly.",
    gradient: "from-orange-500 to-rose-500",
    glowColor: "orange",
    badge: "GPT-5 + Claude",
    stats: "< 30 seconds",
  },
];

const detailFeatures = [
  {
    icon: Sparkles,
    title: "AI Hook Generator",
    description: "Neural networks create scroll-stopping opening lines",
    color: "violet",
  },
  {
    icon: Calendar,
    title: "Calendar View",
    description: "Schedule and manage all your posts in one place",
    color: "blue",
  },
  {
    icon: Send,
    title: "Direct Publishing",
    description: "Publish directly to LinkedIn without copy-pasting",
    color: "green",
  },
  {
    icon: Mic,
    title: "Voice-to-Post AI",
    description: "Speak naturally, get polished LinkedIn content",
    color: "purple",
  },
  {
    icon: FileText,
    title: "Carousel Generation",
    description: "Create stunning carousel posts automatically",
    color: "cyan",
  },
  {
    icon: Lightbulb,
    title: "Smart Suggestions",
    description: "Get content ideas when you're stuck",
    color: "rose",
  },
  {
    icon: Palette,
    title: "AI Image Generation",
    description: "Create stunning visuals for your posts",
    color: "amber",
  },
  {
    icon: MessageSquare,
    title: "Comment AI",
    description: "Build relationships with smart replies",
    color: "indigo",
  },
];

const colorMap: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  violet: { bg: "bg-violet-500/10", text: "text-violet-500", glow: "shadow-violet-500/20", border: "border-violet-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500", glow: "shadow-blue-500/20", border: "border-blue-500/20" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-500", glow: "shadow-emerald-500/20", border: "border-emerald-500/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500", glow: "shadow-purple-500/20", border: "border-purple-500/20" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-500", glow: "shadow-cyan-500/20", border: "border-cyan-500/20" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-500", glow: "shadow-rose-500/20", border: "border-rose-500/20" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-500", glow: "shadow-amber-500/20", border: "border-amber-500/20" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", glow: "shadow-indigo-500/20", border: "border-indigo-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500", glow: "shadow-orange-500/20", border: "border-orange-500/20" },
};

function FloatingParticle({ delay, duration, x, y }: { delay: number; duration: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-cyan-400 rounded-full"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.2, 0.8, 0.2],
        scale: [1, 1.5, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function NeuralNetwork() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <svg className="w-full h-full" viewBox="0 0 800 600" fill="none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        {/* Neural network lines */}
        <motion.path
          d="M100,100 Q200,200 300,150 T500,200 T700,100"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.path
          d="M50,300 Q150,400 250,350 T450,400 T650,300 T800,350"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 4, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.path
          d="M100,500 Q200,450 350,480 T550,450 T750,500"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 3.5, delay: 1, repeat: Infinity, repeatType: "reverse" }}
        />
        {/* Nodes */}
        {[
          { cx: 100, cy: 100 }, { cx: 300, cy: 150 }, { cx: 500, cy: 200 }, { cx: 700, cy: 100 },
          { cx: 150, cy: 350 }, { cx: 350, cy: 400 }, { cx: 550, cy: 350 }, { cx: 750, cy: 400 },
          { cx: 200, cy: 500 }, { cx: 400, cy: 480 }, { cx: 600, cy: 450 },
        ].map((node, i) => (
          <motion.circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r="4"
            fill="#06B6D4"
            initial={{ opacity: 0.2, scale: 0.8 }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </svg>
    </div>
  );
}

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <NeuralNetwork />
      
      {/* Floating Particles */}
      <FloatingParticle delay={0} duration={3} x="10%" y="20%" />
      <FloatingParticle delay={0.5} duration={4} x="85%" y="15%" />
      <FloatingParticle delay={1} duration={3.5} x="25%" y="70%" />
      <FloatingParticle delay={1.5} duration={4} x="75%" y="80%" />
      <FloatingParticle delay={2} duration={3} x="50%" y="40%" />
      <FloatingParticle delay={0.3} duration={3.8} x="90%" y="60%" />
      <FloatingParticle delay={0.8} duration={4.2} x="15%" y="50%" />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Activity className="w-4 h-4" />
            <span>AI-Powered Features</span>
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              dominate LinkedIn
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            Stop guessing what works. Use AI-powered tools designed specifically for LinkedIn success.
          </p>
        </motion.div>

        {/* Main Features - Futuristic Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {mainFeatures.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              className="group relative"
            >
              {/* Card Glow Effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500`} />
              
              {/* Card */}
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 h-full">
                {/* Top bar with badge and stats */}
                <div className="flex items-center justify-between mb-6">
                  <span className={`text-xs font-mono px-3 py-1 rounded-full bg-gradient-to-r ${feature.gradient} text-white`}>
                    {feature.badge}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Zap className="w-3 h-3" />
                    <span>{feature.stats}</span>
                  </div>
                </div>
                
                {/* Icon with glow */}
                <div className="relative mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} blur-xl opacity-40 group-hover:opacity-60 transition-opacity`} />
                  <div className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>

                {/* Animated border line */}
                <motion.div 
                  className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r ${feature.gradient} rounded-full`}
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail Features Grid - Futuristic */}
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {/* Section glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/10 via-transparent to-teal-600/10 rounded-3xl blur-xl" />
          
          <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 lg:p-12 border border-slate-700/30">
            <div className="flex items-center justify-center gap-3 mb-10">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500" />
              <h3 className="text-2xl font-bold text-white">
                And so much more...
              </h3>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500" />
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {detailFeatures.map((feature, i) => {
                const colors = colorMap[feature.color];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`group bg-slate-800/50 backdrop-blur rounded-xl p-5 border ${colors.border} hover:border-opacity-50 transition-all duration-200 cursor-pointer`}
                  >
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg ${colors.glow} transition-shadow`}>
                      <feature.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                    <p className="text-sm text-slate-500">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
