import React from 'react';
import { motion } from 'framer-motion';
import { Star, Target, Zap, ShieldCheck, Globe } from 'lucide-react';
import { StarryBackground } from '@/components/StarryBackground';
import { ShootingStars } from '@/components/ShootingStars';

export const WhyUseUsSection = () => {
  return (
    <div id="why-use-us" className="relative z-20 bg-[#020205] rounded-t-[3rem] overflow-hidden -mt-12 shadow-[0_-30px_60px_rgba(0,0,0,0.8)] pt-20 pb-28 border-t border-white/5">

      {/* Deep Space Nebulas (Realistic Glows) */}
      <div className="absolute inset-0 z-0 opacity-50 transform-gpu" style={{ backfaceVisibility: 'hidden' }}>
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-blue-900/5 to-transparent rounded-full blur-[80px] pointer-events-none transform-gpu"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-purple-900/5 to-transparent rounded-full blur-[80px] pointer-events-none transform-gpu"></div>
        <div className="absolute top-[20%] right-[20%] w-[40vw] h-[40vw] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent rounded-full blur-[60px] pointer-events-none transform-gpu"></div>
      </div>

      {/* Dense Realistic Starfield */}
      <div className="absolute inset-0 z-0 opacity-80 transform-gpu">
        <StarryBackground />
      </div>

      {/* Shooting Stars Animation */}
      <ShootingStars />

      {/* Dark Overlay to blend stars smoothly into the edges */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#020205]/90 via-transparent to-[#020205]/90 pointer-events-none transform-gpu"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          className="text-center mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ delay: 0.3, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-blue-400 font-semibold text-xs mb-6 shadow-sm uppercase tracking-wider backdrop-blur-md"
          >
            <Star className="w-3.5 h-3.5 text-blue-500" /> The LeadReach Advantage
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Why You <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Use Us</span>
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto font-medium">
            We don't just provide data. We provide the interactive engine that powers your entire revenue generation machine.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 relative transform-gpu"
        >
          {[
            {
              icon: <Target className="w-6 h-6 text-blue-400" />,
              title: 'Laser-Focused B2B Search',
              description: 'Filter millions of companies by industry, employee count, and location. Find the exact decision-makers you need in seconds.',
              shadow: 'hover:shadow-blue-500/20',
              glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'
            },
            {
              icon: <Zap className="w-6 h-6 text-amber-400" />,
              title: 'AI Email Copywriting',
              description: 'Stop writing generic emails. Our AI instantly generates personalized, context-aware templates designed to bypass spam filters and guarantee replies.',
              shadow: 'hover:shadow-amber-500/20',
              glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(251,191,36,0.5)]'
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
              title: 'Multi-Account Automation',
              description: 'Connect multiple IMAP and SMTP sender accounts. Distribute your sending volume seamlessly to protect domain reputation while scaling.',
              shadow: 'hover:shadow-emerald-500/20',
              glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(52,211,153,0.5)]'
            },
            {
              icon: <Globe className="w-6 h-6 text-purple-400" />,
              title: 'Deep Campaign Analytics',
              description: 'Track exactly what happens after you hit send. Monitor open rates, click-throughs, and direct replies from a unified dashboard.',
              shadow: 'hover:shadow-purple-500/20',
              glow: 'group-hover:shadow-[0_0_20px_-5px_rgba(167,139,250,0.5)]'
            }
          ].map((reason, index) => (
            <React.Fragment key={index}>
              {/* Dedicated Sequence Shooting Star for this card */}
              <motion.div
                custom={index}
                variants={{
                  hidden: (i) => ({
                    opacity: 0,
                    x: i % 2 === 0 ? -1000 : 1000,
                    y: (i < 2 ? -200 : 200) + (i % 2 === 1 ? 96 : 0),
                    rotate: i % 2 === 0 ? 30 : -30,
                  }),
                  visible: (i) => ({
                    opacity: [0, 1, 1, 0],
                    x: i % 2 === 0 ? 1000 : -1000,
                    y: (i < 2 ? -200 : 200) + (i % 2 === 1 ? 96 : 0) + 800,
                    transition: {
                      delay: i * 0.4,
                      duration: 0.8,
                      ease: "linear"
                    }
                  })
                }}
                className={`absolute hidden md:block w-72 h-[2px] bg-gradient-to-r ${index % 2 === 0 ? 'from-transparent via-white to-transparent' : 'from-transparent via-white to-transparent'} shadow-[0_0_15px_rgba(255,255,255,1)] z-50 pointer-events-none`}
              />

              {/* Wrapper for Zig-Zag layout on desktop */}
              <div className={`relative ${index % 2 === 1 ? 'md:mt-24 md:-mb-24' : ''}`}>
                <motion.div
                  custom={index}
                  variants={{
                    hidden: { opacity: 0, y: 100, scale: 0.8 },
                    visible: (i) => ({
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        delay: (i * 0.4) + 0.3,
                        type: "spring",
                        bounce: 0.4,
                        duration: 0.8
                      }
                    })
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`p-8 rounded-[2rem] bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 transition-all duration-300 shadow-xl shadow-black/50 hover:shadow-2xl hover:bg-zinc-900/80 ${reason.shadow} cursor-pointer group relative z-10`}
                >
                  <motion.div
                    whileHover={{ rotate: 180 }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                    className={`w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-700 shadow-sm flex items-center justify-center mb-6 transition-all duration-500 ${reason.glow} group-hover:scale-110`}
                  >
                    {reason.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-zinc-100 mb-3">{reason.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-base group-hover:text-zinc-300 transition-colors">
                    {reason.description}
                  </p>
                </motion.div>
              </div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
