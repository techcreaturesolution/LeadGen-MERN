import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@/context/ThemeContext';
import { CinematicBackground } from '@/components/CinematicBackground';
import { Navbar } from '@/components/Navbar';
import { SplashIntro } from '@/components/SplashIntro';
import { HeroSection } from '@/components/HeroSection';

// Lazy load below-the-fold sections to split code into small async chunks
const WhyUseUsSection = React.lazy(() =>
  import('@/components/WhyUseUsSection').then((m) => ({ default: m.WhyUseUsSection }))
);
const AspectsSection = React.lazy(() =>
  import('@/components/AspectsSection').then((m) => ({ default: m.AspectsSection }))
);
const PipelineSection = React.lazy(() =>
  import('@/components/PipelineSection').then((m) => ({ default: m.PipelineSection }))
);
const TestimonialsSection = React.lazy(() =>
  import('@/components/TestimonialsSection').then((m) => ({ default: m.TestimonialsSection }))
);
const Footer = React.lazy(() =>
  import('@/components/Footer').then((m) => ({ default: m.Footer }))
);

export const LandingPage = () => {
  // Always play the cinematic splash preloader on page load
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let animationFrameId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return (
    <ThemeProvider>
      <div className="relative min-h-screen bg-transparent text-zinc-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
        {/* --- Global Cinematic Atmospheric Background --- */}
        <CinematicBackground />

        {/* --- Splash Intro Screen (Once per session) --- */}
        <AnimatePresence>
          {showSplash && <SplashIntro onComplete={handleSplashComplete} />}
        </AnimatePresence>

        {/* --- Top Navbar --- */}
        <Navbar />

        <main className="relative z-10">
          {/* --- Hero Section (Eager loaded for instantaneous LCP) --- */}
          <HeroSection />

          {/* --- Why Use Us Section --- */}
          <React.Suspense
            fallback={
              <div className="h-96 w-full bg-transparent flex items-center justify-center text-zinc-600 text-sm">
                Loading advantages...
              </div>
            }
          >
            <WhyUseUsSection />
          </React.Suspense>

          {/* --- Aspects (Features) Section --- */}
          <React.Suspense
            fallback={
              <div className="h-96 w-full bg-transparent flex items-center justify-center text-zinc-600 text-sm">
                Loading interactive engine...
              </div>
            }
          >
            <AspectsSection />
          </React.Suspense>

          {/* --- Pipeline Workflow Section --- */}
          <React.Suspense
            fallback={
              <div className="h-96 w-full bg-transparent flex items-center justify-center text-zinc-600 text-sm">
                Loading pipeline workflow...
              </div>
            }
          >
            <PipelineSection />
          </React.Suspense>

          {/* --- Testimonials Section --- */}
          <React.Suspense
            fallback={
              <div className="h-80 w-full bg-transparent flex items-center justify-center text-zinc-600 text-sm">
                Loading reviews...
              </div>
            }
          >
            <TestimonialsSection />
          </React.Suspense>

          {/* --- Footer --- */}
          <React.Suspense
            fallback={
              <div className="h-32 w-full bg-transparent flex items-center justify-center text-zinc-600 text-sm">
                Loading footer...
              </div>
            }
          >
            <Footer />
          </React.Suspense>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default LandingPage;
