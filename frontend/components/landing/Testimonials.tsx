"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote, TrendingUp, Users, Target, Sparkles } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechStart Inc.",
    image: "/avatars/sarah-johnson.jpg",
    content: "PostInAi transformed how our team creates LinkedIn content. We went from struggling to post once a week to publishing daily content that actually drives leads.",
    stats: { label: "Lead increase", value: "340%" },
  },
  {
    name: "Michael Chen",
    role: "Founder & CEO",
    company: "GrowthLabs",
    image: "/avatars/michael-chen.jpg",
    content: "I was skeptical about AI-generated content, but PostInAi nailed my voice from day one. My engagement tripled and I'm getting inbound leads I never expected.",
    stats: { label: "Engagement boost", value: "3x" },
  },
  {
    name: "Emma Rodriguez",
    role: "Personal Brand Coach",
    company: "BrandYou",
    image: "/avatars/emma-rodriguez.jpg",
    content: "As someone who teaches personal branding, I'm picky about authenticity. PostInAi is the only tool I recommend to my clients because it truly captures individual voices.",
    stats: { label: "Time saved weekly", value: "8hrs" },
  },
  {
    name: "David Park",
    role: "VP of Sales",
    company: "Enterprise Solutions",
    image: "/avatars/david-park.jpg",
    content: "Our sales team uses PostInAi to build their personal brands. The result? More inbound leads and shorter sales cycles. This tool pays for itself 10x over.",
    stats: { label: "Sales cycle reduction", value: "40%" },
  },
  {
    name: "Lisa Thompson",
    role: "Content Strategist",
    company: "Digital First Agency",
    image: "/avatars/lisa-thompson.jpg",
    content: "I manage content for 15+ executives. PostInAi lets me maintain each person's unique voice while scaling our output. It's been a game-changer for our agency.",
    stats: { label: "Clients managed", value: "15+" },
  },
  {
    name: "James Wilson",
    role: "Startup Advisor",
    company: "AngelNetwork",
    image: "/avatars/james-wilson.jpg",
    content: "Every founder I advise now uses PostInAi. Building thought leadership on LinkedIn is crucial for fundraising, and this tool makes it effortless.",
    stats: { label: "Profile views up", value: "500%" },
  },
];


export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Loved by Creators</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            See why{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              top professionals
            </span>{" "}
            choose PostInAi
          </h2>
          <p className="text-lg text-slate-400">
            Join thousands of creators, founders, and executives who are building their personal brands with AI.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="group relative"
            >
              {/* Card Glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 h-full">
                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-violet-500/30 mb-4" />
                
                {/* Content */}
                <p className="text-slate-300 leading-relaxed mb-6">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                
                {/* Stats Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
                  <TrendingUp className="w-4 h-4" />
                  <span>{testimonial.stats.label}: {testimonial.stats.value}</span>
                </div>
                
                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role} at {testimonial.company}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
