"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { UserPlus, MessageSquare, Sparkles, Send, ArrowRight, Cpu, Workflow, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Connect & Learn",
    description: "Connect your LinkedIn profile and let our AI analyze your writing style, expertise, and past content to understand your unique voice.",
    gradient: "from-violet-500 to-purple-500",
    aiFeature: "Voice Analysis",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Chat Your Ideas",
    description: "Share your thoughts, experiences, or topics through our conversational interface. Just talk naturally - we'll handle the rest.",
    gradient: "from-blue-500 to-cyan-500",
    aiFeature: "Natural Language",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "AI Creates Magic",
    description: "Our AI generates engaging posts that sound like you, complete with hooks, stories, and calls-to-action proven to drive engagement.",
    gradient: "from-fuchsia-500 to-pink-500",
    aiFeature: "GPT-4 Generation",
  },
  {
    number: "04",
    icon: Send,
    title: "Publish & Grow",
    description: "Review, edit if needed, and publish directly to LinkedIn. Track your growth and let our insights guide your content strategy.",
    gradient: "from-emerald-500 to-teal-500",
    aiFeature: "Smart Analytics",
  },
];

function DataFlow() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.rect
        x="0"
        y="49"
        width="20"
        height="2"
        fill="url(#flowGradient)"
        initial={{ x: -20 }}
        animate={{ x: 100 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-violet-500 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500 to-transparent" />
      </div>
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -translate-y-1/2" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Workflow className="w-4 h-4" />
            <span>Simple Workflow</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            From idea to viral post in{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              4 simple steps
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            No complicated setup. No learning curve. Just start creating content that converts.
          </p>
        </motion.div>

        {/* Steps - Horizontal Timeline */}
        <div className="max-w-6xl mx-auto mb-16">
          {/* Connection Line */}
          <div className="hidden lg:block relative h-1 mb-12">
            <div className="absolute inset-0 bg-slate-800 rounded-full" />
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={isInView ? { width: "100%" } : {}}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
            <DataFlow />
          </div>

          {/* Step Cards */}
          <div className="grid lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                className="relative group"
              >
                {/* Card Glow */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${step.gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`} />
                
                {/* Card */}
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 h-full">
                  {/* Step Number */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center font-mono font-bold text-white shadow-lg`}>
                      {step.number}
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
                      {step.aiFeature}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="relative mb-4">
                    <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} blur-lg opacity-20 group-hover:opacity-40 transition-opacity`} />
                    <div className={`relative w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700`}>
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>

                  {/* Progress indicator */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-slate-500" />
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full bg-gradient-to-r ${step.gradient}`}
                          initial={{ width: 0 }}
                          animate={isInView ? { width: "100%" } : {}}
                          transition={{ duration: 1, delay: 0.8 + i * 0.2 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Connection Line */}
                {i < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center py-4">
                    <motion.div 
                      className="w-0.5 h-8 bg-gradient-to-b from-slate-700 to-transparent"
                      initial={{ scaleY: 0 }}
                      animate={isInView ? { scaleY: 1 } : {}}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.15 }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all">
              <Cpu className="w-5 h-5 mr-2" />
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-slate-500">No credit card required • Start free today</p>
        </motion.div>
      </div>
    </section>
  );
}
