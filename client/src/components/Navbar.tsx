import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export const Navbar = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    
    // Add backdrop blur when scrolled past top
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }

    // Hide on scroll down, show on scroll up
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.nav 
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-[#050505]/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="text-xl font-bold text-white flex items-center gap-2 transition-transform hover:scale-105">
          <div className="flex gap-0.5 items-end h-5">
            <div className="w-1.5 h-3 bg-[#2563EB] rounded-sm"></div>
            <div className="w-1.5 h-5 bg-[#2563EB] rounded-sm"></div>
            <div className="w-1.5 h-4 bg-[#2563EB] rounded-sm"></div>
          </div>
          LeadReach AI
        </Link>

        {/* Center: Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link to="/features" className="hover:text-white transition-colors">Features</Link>
          <Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block">
            <Button variant="outline" className="border-zinc-700 bg-transparent hover:bg-zinc-800 text-white">Login</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white border-0 shadow-lg shadow-blue-500/25">Get Started</Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};
