import React, { useEffect, useRef, useState } from "react";
// Assuming React Router's Link is available in the environment
// import { Link } from "react-router-dom"; 
// Using a simple <a> tag fallback for Link in this single-file context
import { motion, AnimatePresence } from "framer-motion";

/**
 * LazyImage Component
 * Handles lazy loading and smooth fade-in using IntersectionObserver and framer-motion.
 */
function LazyImage({
  src,
  alt = "",
  className = "",
  placeholder,
  style = {},
  rootMargin = "200px",
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const imgEl = ref.current;
    if (!imgEl) return;

    // Use native lazy loading as a hint for modern browsers
    if ("loading" in HTMLImageElement.prototype) {
      setVisible(true);
      // Fallback is still necessary for older browsers, but we don't need to return early
    }

    let obs;
    // IntersectionObserver setup
    const options = { rootMargin };
    const callback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (obs) obs.disconnect();
        }
      });
    };

    try {
      if (!visible) {
        obs = new IntersectionObserver(callback, options);
        obs.observe(imgEl);
      }
    } catch (err) {
      // Fallback for no IntersectionObserver support: show immediately
      setVisible(true);
    }
    
    // Cleanup function
    return () => {
      if (obs && obs.disconnect) obs.disconnect();
    };
  }, [rootMargin, visible]);


  // Placeholder for error handling (using a simple, dark fallback image)
  const handleError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'%3E%3Crect fill='%2318181b' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Arial' font-size='28' fill='%2371717a'%3EImage%20Unavailable%3C/text%3E%3C/svg%3E";
  };


  return (
    <div 
      ref={ref} 
      className={`relative w-full h-full overflow-hidden ${className}`} 
      style={style}
    >
      {/* Blurred Low-Resolution Placeholder */}
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt={alt}
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ filter: "blur(8px)", transform: "scale(1.05)", opacity: loaded ? 0 : 1 }}
        />
      )}

      {/* High-Resolution Motion Image */}
      <AnimatePresence mode="popLayout">
        {visible && (
          <motion.img
            key={src} // Key change triggers the exit/enter animations
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: loaded ? 1 : 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onLoad={() => setLoaded(true)}
            onError={handleError}
            className="w-full h-full object-cover transition-opacity duration-300 absolute inset-0"
            // Ensure the main image is visible over the placeholder upon load
            style={{ zIndex: 10 }}
            {...rest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


/**
 * HeroSlider Component (The main application component)
 * Renders the sliding hero section with text and image transitions.
 */
export function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), 6000); // 6s interval
    return () => clearTimeout(t);
  }, [index, slides]);

  // Mock data structure if not provided
  if (!slides || slides.length === 0) {
    slides = [
      {
        eyebrow: "SUMMER COLLECTION 2024",
        title: "The Future of Minimalist Design",
        subtitle: "Discover timeless pieces crafted with sustainable materials and unparalleled attention to detail.",
        href: "#collection",
        img: "https://placehold.co/1200x800/1e293b/f8fafc?text=HERO+SLIDE+1",
        placeholder: "https://placehold.co/60x40/1e293b/f8fafc?text=.",
        alt: "A minimalist chair set against a neutral backdrop."
      },
      {
        eyebrow: "EXCLUSIVE DROP",
        title: "Craftsmanship Meets Modern Utility",
        subtitle: "Limited edition apparel and accessories designed for the urban explorer.",
        href: "#exclusive",
        img: "https://placehold.co/1200x800/374151/f3f4f6?text=HERO+SLIDE+2",
        placeholder: "https://placehold.co/60x40/374151/f3f4f6?text=.",
        alt: "A model wearing stylish, modern sportswear."
      }
    ];
  }

  const slide = slides[index];
  const slideVariants = {
    enter: { opacity: 0, x: -50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  };

  return (
    <section className="relative min-h-[calc(100vh-64px)] lg:min-h-screen flex items-center bg-zinc-950 text-white overflow-hidden">
      
      {/* Background Image Container - Always takes up full space */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={index} // Key change triggers image transition
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <LazyImage
              src={slide.img}
              alt={slide.alt}
              placeholder={slide.placeholder}
            />
            {/* Dark Overlay for contrast on all screen sizes */}
            <div className="absolute inset-0 bg-black/60 lg:bg-black/30" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full h-full flex items-center justify-center lg:justify-start">
        <div className="w-full lg:w-4/5 xl:w-3/5 max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-0">
          
          {/* Content Box - ensures legibility on mobile and defined space on desktop */}
          <div className="max-w-xl p-8 rounded-xl backdrop-blur-sm bg-black/40 lg:bg-transparent lg:p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.6, ease: [0.17, 0.67, 0.83, 0.67] }} // Custom spring-like easing
                className="space-y-6"
              >
                {/* Eyebrow */}
                {slide.eyebrow && (
                  <div className="text-sm tracking-widest uppercase text-yellow-300 font-semibold border-l-4 border-yellow-300 pl-3">
                    {slide.eyebrow}
                  </div>
                )}

                {/* Title */}
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-snug">
                  {slide.title}
                </h1>

                {/* Subtitle */}
                <p className="pt-4 text-base lg:text-xl text-gray-200 max-w-lg">
                  {slide.subtitle}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <a
                    href={slide.href} // Using <a> as Link replacement
                    className="px-8 py-3 rounded-full bg-red-600 text-white font-bold tracking-wider uppercase text-sm hover:bg-red-700 transition-all duration-300 shadow-xl shadow-red-600/30 hover:scale-[1.03] transform"
                  >
                    SHOP NOW
                  </a>

                  <a
                    href="#lookbook" // Using <a> as Link replacement
                    className="px-6 py-3 rounded-full text-white/90 border border-white/30 font-semibold text-sm hover:bg-white/10 transition-all duration-300"
                  >
                    EXPLORE LOOKBOOK
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Indicators */}
      <div className="absolute bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`
              relative w-2.5 h-2.5 rounded-full transition-all duration-300
              ${i === index 
                ? "w-8 bg-red-600 shadow-md shadow-red-600/50" 
                : "bg-white/40 hover:bg-white/80"
              }
            `}
          >
            {/* Optional: Add a subtle loading bar effect to the current indicator */}
            {i === index && (
                <motion.div
                    className="absolute inset-0 bg-red-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 6, ease: "linear" }}
                    style={{ originX: 0 }}
                />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

// Default export is required for single-file React Immersives
export default HeroSlider;