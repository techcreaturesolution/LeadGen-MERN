import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Send, Mail, Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative bg-[#020205] pt-32 pb-12 overflow-hidden border-t border-white/5">
      {/* Background Glows */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-purple-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Massive CTA Section */}
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800 rounded-[3rem] p-12 md:p-20 text-center mb-24 relative overflow-hidden group shadow-2xl shadow-black">
          {/* Hover Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
              Ready to put your pipeline <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">on autopilot?</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
              Join 10,000+ forward-thinking teams closing more deals with LeadReach AI. Get started in less than 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <button className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                  Start Automating Free <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </Link>
              <Link to="/demo">
                <button className="px-8 py-4 bg-transparent border border-zinc-700 text-white font-bold rounded-full hover:bg-zinc-800 transition-colors">
                  Talk to Sales
                </button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16 border-b border-zinc-800/50 pb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">LeadReach AI</span>
            </Link>
            <p className="text-zinc-400 text-sm max-w-sm mb-8 leading-relaxed">
              The world's most advanced AI-powered B2B lead generation and outreach pipeline. We find them, you close them.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Website" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-blue-500 transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Telegram" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-blue-500 transition-colors">
                <Send className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Email" className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-blue-500 transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Product</h3>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-blue-400 transition-colors">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Resources</h3>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li><span className="cursor-pointer hover:text-blue-400 transition-colors">Documentation</span></li>
              <li><span className="cursor-pointer hover:text-blue-400 transition-colors">API Reference</span></li>
              <li><span className="cursor-pointer hover:text-blue-400 transition-colors">Blog</span></li>
              <li><span className="cursor-pointer hover:text-blue-400 transition-colors">Community</span></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Company</h3>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} LeadReach AI. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
