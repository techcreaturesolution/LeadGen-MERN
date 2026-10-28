import React from 'react';
import { motion } from 'framer-motion';
import { Database, Sparkles, Zap, ShieldCheck, ArrowUpRight } from '@/components/icons';

const aspects = [
  {
    id: '01',
    title: "Verified B2B Search",
    description: "Extract accurate contact information by filtering through millions of companies by industry, location, and employee count.",
    icon: <Database className="w-7 h-7 text-blue-400" />,
    badge: "99.4% Accuracy",
    color: "from-blue-500/20 via-blue-500/5 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]",
    borderGlow: "group-hover:border-blue-500/40",
    metric: "25M+ Verified Contacts",
  },
  {
    id: '02',
    title: "AI Email Frameworks",
    description: "Leverage intelligent, intent-based email templates that are dynamically generated to maximize reply rates and bypass spam filters.",
    icon: <Sparkles className="w-7 h-7 text-indigo-400" />,
    badge: "10x Reply Rates",
    color: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]",
    borderGlow: "group-hover:border-indigo-500/40",
    metric: "Dynamic Context Engine",
  },
  {
    id: '03',
    title: "Multi-Account Sending",
    description: "Connect unlimited IMAP and SMTP sender accounts to distribute email volume and protect your primary domain reputation.",
    icon: <Zap className="w-7 h-7 text-purple-400" />,
    badge: "Zero Domain Burns",
    color: "from-purple-500/20 via-purple-500/5 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]",
    borderGlow: "group-hover:border-purple-500/40",
    metric: "Smart Warmup & Rotation",
  }
];

export const AspectsSection = () => {
  return (
    <section id="aspects" className="relative py-20 md:py-28 bg-[#020205] overflow-hidden border-t border-white/5">
      {/* Lightweight Ambient Background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none transform-gpu">
        <div 
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12)_0%,transparent_60%)] animate-pulse" 
          style={{ animationDuration: '6s' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
      </div>

      {/* Overlay Gradients for smooth blending */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#020205] via-transparent to-[#020205] pointer-events-none opacity-80" />

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-xs mb-6 uppercase tracking-wider backdrop-blur-md"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Powerful Infrastructure
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black tracking-tight text-white mb-5"
          >
            Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Aspects</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium"
          >
            Explore the cutting-edge features that make our lead generation and outreach engine unmatched.
          </motion.p>
        </div>

        {/* 3-Column Interactive Cards Grid (No 400vh empty scroll gap) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {aspects.map((aspect, index) => (
            <motion.div
              key={aspect.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className={`group relative p-8 md:p-10 rounded-[2.5rem] bg-zinc-900/40 backdrop-blur-xl border border-white/5 transition-all duration-300 shadow-2xl hover:bg-zinc-900/70 ${aspect.glow} ${aspect.borderGlow} flex flex-col justify-between`}
            >
              {/* Corner Ambient Glow */}
              <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${aspect.color} rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />

              <div>
                {/* Top Badge & Number */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:border-zinc-700 transition-all duration-300">
                    {aspect.icon}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400 group-hover:text-white transition-colors">
                    {aspect.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-between">
                  {aspect.title}
                  <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </h3>

                {/* Description */}
                <p className="text-base text-zinc-400 leading-relaxed mb-6 group-hover:text-zinc-300 transition-colors">
                  {aspect.description}
                </p>
              </div>

              {/* Bottom Metric Tag */}
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Engine Feature</span>
                <span className="text-xs font-bold text-blue-400">{aspect.metric}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
