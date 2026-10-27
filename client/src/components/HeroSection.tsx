import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StarryBackground } from '@/components/StarryBackground';

export const HeroSection = () => {
  return (
    <section className="min-h-[calc(100vh+48px)] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden pt-20">

      {/* Background Layer: Stars */}
      <StarryBackground />

      {/* Background Layer: Aurora (Removed, now global in CinematicBackground) */}

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050505] to-transparent z-0"></div>

      {/* Foreground Layer: Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mb-8 px-4 py-1.5 rounded-full border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm text-sm font-medium text-zinc-300 shadow-sm"
        >
          Discover &bull; Connect &bull; Grow
        </motion.div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white leading-[1.15]">
          <motion.span
            className="block"
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.0, delay: 1.8, ease: "easeOut" }}
          >
            Find Businesses.
          </motion.span>
          
          <motion.span
            className="block"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.0, delay: 2.1, ease: "easeOut" }}
          >
            Generate Leads.
          </motion.span>
          
          <motion.span
            className="block text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#2563EB] to-[#8B5CF6]"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, delay: 2.4, ease: "backOut" }}
          >
            Grow Faster.
          </motion.span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.8 }}
          className="text-lg md:text-xl text-zinc-400 mb-10 max-w-3xl mx-auto leading-relaxed"
        >
          LeadReach AI helps businesses discover verified companies, generate high-quality leads, organize outreach campaigns, and manage customer pipelines&mdash;all from one modern platform.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3.0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto text-base font-semibold px-8 bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-0 h-14 rounded-full shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/demo">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base font-semibold px-8 bg-zinc-800/50 hover:bg-zinc-800 text-white border-zinc-700 h-14 rounded-full backdrop-blur-sm transition-all hover:-translate-y-0.5">
              Watch Demo
            </Button>
          </Link>
        </motion.div>

      </div>
    </section>
  );
};
