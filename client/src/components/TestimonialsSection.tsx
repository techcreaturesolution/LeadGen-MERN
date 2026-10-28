import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Star, Sparkles, Quote, Hand } from '@/components/icons';

const testimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "VP of Sales, TechGrowth",
    content: "LeadReach AI completely transformed our outbound strategy. We went from finding 50 leads a week to booking 20 meetings a day. The AI personalization is uncanny.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=70&w=96&h=96",
    color: "from-blue-500/20 to-cyan-500/20"
  },
  {
    id: 2,
    name: "Marcus Thorne",
    role: "Founder, Apex Agency",
    content: "I've used every CRM on the market. Nothing comes close to the automated pipeline LeadReach provides. It's truly a game changer for our SDRs.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=70&w=96&h=96",
    color: "from-purple-500/20 to-pink-500/20"
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Marketing Director, CloudSync",
    content: "The data enrichment alone is worth the price. It finds verified emails that Hunter and ZoomInfo miss. The automated follow-ups are just the cherry on top.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=70&w=96&h=96",
    color: "from-emerald-500/20 to-teal-500/20"
  },
  {
    id: 4,
    name: "David Chen",
    role: "Head of Growth, Elevate B2B",
    content: "Watching the AI agents work in real-time is mind-blowing. It handles the busywork so my sales team can actually focus on closing deals.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=70&w=96&h=96",
    color: "from-amber-500/20 to-orange-500/20"
  },
  {
    id: 5,
    name: "Jessica Walsh",
    role: "CEO, InnovateNow",
    content: "Since we started using LeadReach AI, our conversion rates have doubled. It's like magic. We've scaled our pipeline without adding headcount.",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=70&w=96&h=96",
    color: "from-rose-500/20 to-red-500/20"
  }
];

export const TestimonialsSection = () => {
  const [cards, setCards] = useState(testimonials);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, cardId: number) => {
    // If swiped far enough left or right, remove the card
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.offset.y) > 100) {
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    }
  };

  const handleReset = () => {
    setCards(testimonials);
  };

  return (
    <section className="relative py-32 bg-[#020205] overflow-hidden border-t border-white/5">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[150px] mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-sm tracking-wide mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)]"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" /> Swipe The Reviews
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-tight"
        >
          Loved By <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Sales Leaders</span>
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-xl text-zinc-400 max-w-2xl mx-auto"
        >
          Drag and throw the cards to read what our users have to say about LeadReach AI.
        </motion.p>
      </div>

      {/* Swipeable Card Stack */}
      <div className="relative w-full h-[550px] flex items-center justify-center">
        {cards.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <p className="text-2xl text-zinc-400 font-medium">You've read all the reviews!</p>
            <button 
              onClick={handleReset}
              className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              Bring Them Back
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {cards.map((testimonial, index) => {
            const isTopCard = index === cards.length - 1;
            const offset = (cards.length - 1 - index) * 20;
            const scale = 1 - (cards.length - 1 - index) * 0.05;

            return (
              <motion.div
                key={testimonial.id}
                initial={{ scale: 0.8, opacity: 0, y: 100 }}
                animate={{ 
                  scale: scale, 
                  y: offset,
                  rotateZ: isTopCard ? 0 : (index % 2 === 0 ? -2 : 2), // Subtle tilt for cards underneath
                  opacity: 1
                }}
                exit={{ x: -1000, opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                drag={isTopCard ? true : false}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={1}
                onDragEnd={(e, info) => handleDragEnd(e, info, testimonial.id)}
                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                className={`absolute w-full max-w-[420px] p-[1px] rounded-[2.5rem] bg-gradient-to-br ${testimonial.color} cursor-grab shadow-2xl backdrop-blur-xl`}
                style={{ zIndex: index }}
              >
                <div className="bg-[#0a0a0f]/90 rounded-[2.5rem] p-10 h-[420px] flex flex-col relative overflow-hidden">
                   {/* Animated corner gradient */}
                   <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${testimonial.color} rounded-full blur-[50px] opacity-50`}></div>
                   
                   <Quote className="w-10 h-10 text-white/10 mb-6 absolute top-8 right-8" />
                   
                   <div className="flex gap-1 mb-6">
                     {[...Array(5)].map((_, i) => (
                       <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
                     ))}
                   </div>
                   
                   <p className="text-white text-xl font-medium leading-relaxed flex-grow select-none">
                     "{testimonial.content}"
                   </p>
                   
                   <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/10">
                     <img 
                       src={testimonial.avatar} 
                       alt={testimonial.name} 
                       width="56"
                       height="56"
                       loading="lazy"
                       decoding="async"
                       className="w-14 h-14 rounded-full border-2 border-white/20 object-cover pointer-events-none select-none" 
                     />
                     <div>
                       <h4 className="text-white font-bold tracking-wide select-none">{testimonial.name}</h4>
                       <p className="text-indigo-400 font-medium text-sm select-none">{testimonial.role}</p>
                     </div>
                   </div>

                   {/* Swipe hint */}
                   {isTopCard && (
                     <div className="absolute bottom-8 right-8 flex flex-col items-center justify-center opacity-50 animate-pulse pointer-events-none">
                        <Hand className="w-6 h-6 text-white mb-1" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest">Swipe</span>
                     </div>
                   )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
};
