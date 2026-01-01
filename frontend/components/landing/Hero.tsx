"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Star, Users, Brain, Sparkles, Cpu, Zap, Activity } from "lucide-react";

const stats = [
  { value: "10x", label: "Faster with AI", icon: Zap },
  { value: "95%", label: "Voice accuracy", icon: Brain },
  { value: "50K+", label: "AI posts created", icon: Activity },
];

const avatars = [
  { name: "Sarah", gradient: "from-pink-500 to-rose-500" },
  { name: "Mike", gradient: "from-blue-500 to-cyan-500" },
  { name: "Emma", gradient: "from-green-500 to-emerald-500" },
  { name: "John", gradient: "from-violet-500 to-purple-500" },
  { name: "Lisa", gradient: "from-orange-500 to-amber-500" },
];

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />
    </div>
  );
}

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function Hero() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="relative pt-32 pb-24 overflow-hidden bg-slate-950">
      {/* Grid Background */}
      <GridBackground />
      
      {/* Animated Gradient Orbs */}
      <FloatingOrb className="absolute top-40 left-10 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" delay={0} />
      <FloatingOrb className="absolute top-60 right-10 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" delay={2} />
      <FloatingOrb className="absolute bottom-40 left-1/3 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl" delay={4} />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-8 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Cpu className="w-4 h-4" />
            <span>Powered by GPT-4 & Neural Voice Matching</span>
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Turn LinkedIn posts into{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              revenue
            </span>{" "}
            without wondering what to write
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Our AI learns your unique voice and writing style, then generates authentic LinkedIn content 
            that sounds like you—not a robot. Powered by neural networks trained on millions of high-performing posts.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/login">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transition-all group">
                Start Creating Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg font-semibold border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 hover:text-white transition-all">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center">
              <div className="flex -space-x-3">
                {avatars.map((avatar, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    className={`w-10 h-10 bg-gradient-to-br ${avatar.gradient} rounded-full border-2 border-slate-900 flex items-center justify-center text-white font-semibold text-sm`}
                  >
                    {avatar.name[0]}
                  </motion.div>
                ))}
              </div>
              <div className="ml-4 text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-400">Loved by 2,000+ creators</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-slate-700" />
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-5 h-5" />
              <span className="text-sm">Join professionals from top companies</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-6 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-4">
                  <stat.icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Product Preview */}
        <motion.div 
          className="mt-20 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-600/30 via-teal-600/20 to-cyan-600/30 rounded-3xl blur-2xl" />
            
            {/* Preview Window */}
            <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
              {/* Browser Bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-slate-900/50 rounded-md text-sm text-slate-400 border border-slate-700/50">
                    app.contentai.com
                  </div>
                </div>
              </div>
              
              {/* App Preview Content */}
              <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 min-h-[400px]">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Chat Interface Preview */}
                  <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-white">AI Content Engine</span>
                        <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">GPT-4</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
                        I want to write about my experience launching a startup...
                      </div>
                      <div className="bg-cyan-500/10 rounded-lg p-3 text-sm text-cyan-300 border border-cyan-500/20">
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span className="text-xs font-medium text-cyan-400">Voice Match: 96%</span>
                        </div>
                        Creating a story-driven post matching your authentic voice. Using your signature hook style + data-backed insights...
                      </div>
                    </div>
                  </div>
                  
                  {/* Post Preview */}
                  <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                        YN
                      </div>
                      <div>
                        <p className="font-semibold text-white">Your Name</p>
                        <p className="text-xs text-slate-500">Founder & CEO • 1st</p>
                      </div>
                    </div>
                    <div className="text-sm text-slate-300 space-y-2">
                      <p className="font-medium">🚀 3 years ago, I left my job to build a startup.</p>
                      <p>Here&apos;s what nobody told me about the journey:</p>
                      <p className="text-slate-500">...</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex gap-4 text-xs text-slate-500">
                      <span>❤️ 1.2K</span>
                      <span>💬 89 comments</span>
                      <span>🔄 156 reposts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
