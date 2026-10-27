import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Search, MapPin, LayoutDashboard, Sparkles,
  Users, Mail, CheckCircle2, ChevronRight, TrendingUp, Building, Zap
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// 3D Tilt Card Component
const TiltCard = ({ step }: { step: any }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden" // Prevents backward text
      }}
      className="w-full h-full relative flex flex-col pointer-events-auto"
    >
      {/* 3D Floating Header Elements */}
      <div className="mb-4 relative" style={{ transform: "translateZ(60px)" }}>
        <div className={`w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-4 shadow-2xl shadow-black relative z-10`}>
          {step.icon}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-20 blur-xl -z-10`}></div>
        </div>
        <div className="text-xs font-black text-zinc-500 mb-1 tracking-widest uppercase">STEP {step.id}</div>
        <h3 className="text-2xl font-black mb-2 text-white">{step.title}</h3>
        <p className="text-sm text-zinc-400 font-medium">{step.subtitle}</p>
      </div>

      {/* 3D Floating Content Box */}
      <div className="flex-1 w-full" style={{ transform: "translateZ(30px)" }}>
        {step.content}
      </div>

      {/* Deep Background Shadow for 3D depth */}
      <div className="absolute inset-0 bg-black/50 blur-3xl rounded-[3rem] -z-20 transform translate-y-10 scale-90"></div>
    </motion.div>
  );
};

export const PipelineSection = () => {
  const containerRef = useRef<HTMLElement>(null);

  const steps = [
    {
      id: "01",
      title: "Company Generation",
      subtitle: "Generate and extract verified company leads.",
      icon: <Search className="w-7 h-7 text-blue-400" />,
      color: "from-blue-500 to-cyan-500",
      content: (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group w-full h-full backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-transparent group-hover:from-blue-500/10 transition-all duration-500 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/80 pb-3" style={{ transform: "translateZ(10px)" }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/80" />
            <span className="ml-2 text-[10px] text-zinc-500 font-mono tracking-wider">Discovery Engine</span>
          </div>

          <div className="space-y-4" style={{ transform: "translateZ(20px)" }}>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                 <Search className="w-3.5 h-3.5 text-blue-400" />
                 <div className="w-3/4 h-1.5 bg-zinc-800 rounded-full"></div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">Software</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">USA</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">50-200 Emp</span>
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
               <div className="flex items-center justify-between p-2.5 border-b border-zinc-800/50 bg-zinc-950/50">
                 <span className="text-[10px] font-bold text-zinc-300">Found 1,245 Companies</span>
               </div>
               <div className="p-2 space-y-2">
                 {[1, 2].map((i) => (
                   <div key={i} className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                         <Building className="w-3 h-3 text-blue-400" />
                       </div>
                       <div>
                         <div className="w-16 h-1.5 bg-zinc-700 rounded-full mb-1"></div>
                         <div className="w-10 h-1.5 bg-zinc-800 rounded-full"></div>
                       </div>
                     </div>
                     <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "02",
      title: "Email Templates",
      subtitle: "Craft personalized AI email templates for your target audience.",
      icon: <Sparkles className="w-7 h-7 text-purple-400" />,
      color: "from-purple-500 to-pink-500",
      content: (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group w-full h-full backdrop-blur-xl flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-transparent to-transparent group-hover:from-purple-500/10 transition-all duration-500 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/80 pb-3" style={{ transform: "translateZ(10px)" }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500/80" />
            <span className="ml-2 text-[10px] text-zinc-500 font-mono tracking-wider">Template Generator</span>
          </div>

          <div className="flex-1 space-y-3 relative" style={{ transform: "translateZ(20px)" }}>
             <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2.5 shadow-inner">
               <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Subject</span>
               <div className="w-3/4 h-2 bg-purple-500/30 rounded-full"></div>
             </div>
             <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 shadow-inner flex-1 h-32 flex flex-col">
               <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Body</span>
               <div className="space-y-1.5 w-full">
                 <div className="w-1/3 h-1.5 bg-zinc-700 rounded-full"></div>
                 <div className="w-full h-1.5 bg-zinc-800 rounded-full"></div>
                 <div className="w-5/6 h-1.5 bg-zinc-800 rounded-full"></div>
                 <div className="w-full h-1.5 bg-zinc-800 rounded-full"></div>
                 <div className="w-2/3 h-1.5 bg-zinc-800 rounded-full"></div>
               </div>
               <div className="mt-auto ml-auto px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center gap-1">
                 <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                 <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest">AI Generated</span>
               </div>
             </div>
          </div>
        </div>
      )
    },
    {
      id: "03",
      title: "Bulk Sending",
      subtitle: "Send multiple emails simultaneously to all your generated companies.",
      icon: <Mail className="w-7 h-7 text-emerald-400" />,
      color: "from-emerald-500 to-teal-500",
      content: (
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group w-full h-full backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-transparent group-hover:from-emerald-500/10 transition-all duration-500 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/80 pb-3" style={{ transform: "translateZ(10px)" }}>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-[10px] text-zinc-500 font-mono tracking-wider">Bulk Outreach</span>
          </div>

          <div className="space-y-2.5" style={{ transform: "translateZ(20px)" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Building className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div>
                    <div className="w-16 h-1.5 bg-zinc-700 rounded-full mb-1"></div>
                    <div className="w-10 h-1.5 bg-zinc-800 rounded-full"></div>
                  </div>
                </div>
                {i === 1 ? (
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                  </div>
                ) : i === 2 ? (
                  <div className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[8px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                  </div>
                ) : (
                  <div className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[8px] font-bold border border-blue-500/30 flex items-center gap-1 animate-pulse">
                    <Zap className="w-2.5 h-2.5" /> Sending...
                  </div>
                )}
              </div>
            ))}
            
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
               <span className="text-[10px] text-zinc-400 font-medium">Batch Progress</span>
               <span className="text-[10px] text-emerald-400 font-bold">2/1,245</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
               <div className="h-full bg-emerald-500 w-[15%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            </div>
          </div>
        </div>
      )
    }
  ];

  useGSAP(() => {
    // 1. Create a GSAP timeline tied to scroll progress
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "center center",
        end: "+=3000", // Total scroll distance (3 phases)
        scrub: 1,
        pin: true,
      }
    });

    // 2. Rotate the entire carousel container by 240 degrees (Card 1 -> 2 -> 3)
    // Duration is 2 "units" of time.
    tl.to('.carousel-container', { rotateY: -240, ease: "none", duration: 2 }, 0);

    // 3. Card 0 (Discovery): Starts active, fades out during first scroll phase
    tl.to('.card-0', { opacity: 0.1, scale: 0.7, filter: "blur(12px)", duration: 1 }, 0);

    // 4. Card 1 (Outreach): Fades in during first scroll phase, fades out during second
    tl.fromTo('.card-1',
      { opacity: 0.1, scale: 0.7, filter: "blur(12px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1, ease: "power2.inOut" },
      0
    );
    tl.to('.card-1', { opacity: 0.1, scale: 0.7, filter: "blur(12px)", duration: 1, ease: "power2.inOut" }, 1);

    // 5. Card 2 (Conversion): Stays hidden during first phase, fades in during second
    tl.fromTo('.card-2',
      { opacity: 0, scale: 0.7, filter: "blur(12px)" },
      { opacity: 0.1, scale: 0.7, filter: "blur(12px)", duration: 1, ease: "none" },
      0
    );
    tl.to('.card-2', { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1, ease: "power2.inOut" }, 1);

  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="w-full min-h-screen bg-[#020205] relative overflow-hidden flex flex-col items-center justify-center perspective-[2000px] pt-8 pb-16 md:pt-12 md:pb-24">

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_100%)] pointer-events-none"></div>

      {/* Header flows naturally instead of absolute position to prevent overlapping */}
      <div className="relative text-center z-50 px-4 mb-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6"
        >
          <Sparkles className="w-4 h-4" /> Scroll to explore
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white"
        >
          3-Step Intelligence
        </motion.h2>
      </div>

      {/* The 3D Carousel Stage */}
      <div className="relative w-full max-w-sm h-[420px] pointer-events-none scale-[0.9] md:scale-100 origin-top -mt-2">
        <div className="carousel-container absolute inset-0 w-full h-full will-change-transform transform-gpu" style={{ transformStyle: 'preserve-3d' }}>

          {/* Card 0: Discovery */}
          <div className="card-0 absolute inset-0 w-full h-full will-change-transform will-change-opacity will-change-filter transform-gpu" style={{ transform: "rotateY(0deg) translateZ(450px)" }}>
            <TiltCard step={steps[0]} />
          </div>

          {/* Card 1: Outreach */}
          {/* Starts rotated 120deg away, scaled down and blurred */}
          <div className="card-1 absolute inset-0 w-full h-full will-change-transform will-change-opacity will-change-filter transform-gpu" style={{ transform: "rotateY(120deg) translateZ(450px)", opacity: 0.1, scale: 0.7, filter: "blur(12px)" }}>
            <TiltCard step={steps[1]} />
          </div>

          {/* Card 2: Conversion */}
          {/* Starts rotated 240deg away, scaled down and blurred */}
          <div className="card-2 absolute inset-0 w-full h-full will-change-transform will-change-opacity will-change-filter transform-gpu" style={{ transform: "rotateY(240deg) translateZ(450px)", opacity: 0, scale: 0.7, filter: "blur(12px)" }}>
            <TiltCard step={steps[2]} />
          </div>

        </div>
      </div>

    </section>
  );
};
