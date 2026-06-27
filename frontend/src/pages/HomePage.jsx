import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import BrandsSection from '../components/BrandsSection';
import BrandsCarousel from '../components/BrandsCarousel';

const VIDEO_URL = 'https://www.youtube.com/watch?v=FKeM-5Xk94o';
const VIDEO_MP4 = '/assets/hero.mp4';
const FALLBACK_IMG = 'https://via.placeholder.com/1400x800?text=Tyre+Hero';
const getEmbedUrl = (url) => {
  const idMatch = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/) || url.match(/embed\/([^?&]+)/);
  const id = idMatch ? idMatch[1] : url;
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&rel=0&loop=1&playlist=${id}&modestbranding=1&playsinline=1`;
};
const EMBED_SRC = getEmbedUrl(VIDEO_URL);

export default function HomePage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  // using MP4 video as hero across all devices

  return (
    <div className="relative overflow-hidden">
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative min-h-[80vh] flex items-center justify-center px-4 py-20 sm:px-6"
      >
        <div className="absolute inset-0 -z-10 overflow-hidden bg-black flex items-center justify-center">
          <div className="absolute w-[300vw] h-[300vh] sm:w-[150vw] sm:h-[150vh] pointer-events-none opacity-80">
            <ReactPlayer
              url="https://www.youtube.com/watch?v=FKeM-5Xk94o"
              playing
              loop
              muted
              playsinline
              width="100%"
              height="100%"
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    showinfo: 0,
                    modestbranding: 1,
                    rel: 0,
                    disablekb: 1,
                    fs: 0,
                    enablejsapi: 1,
                    iv_load_policy: 3
                  }
                }
              }}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <div className="absolute inset-0 bg-black/60" aria-hidden="true"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(225,6,0,0.15),_transparent_45%)]" aria-hidden="true"></div>
        </div>
        <div className="relative mx-auto max-w-6xl text-center text-white z-10">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl font-bold uppercase tracking-[0.2em] sm:text-6xl"
          >
            Drive Safer. Grip Better.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg"
          >
            Premium tyre solutions for bikes, cars, autos and lorries from Atmakur, Nandyal Dist., Andhra Pradesh.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to="/tyres" className="rounded-full bg-primary px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition hover:bg-white hover:text-black shadow-lg shadow-primary/20">
              Explore Tyres
            </Link>
            <Link to="/contact" className="rounded-full border border-white/20 bg-black/40 backdrop-blur-md px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition hover:border-primary hover:text-primary hover:bg-black/60">
              Contact Us
            </Link>
          </motion.div>
        </div>
      </motion.section>
      {/* Brands carousel (auto-scrolling) */}
      <BrandsCarousel />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex flex-col items-start">
          <h2 className="text-2xl font-bold tracking-wider text-white uppercase sm:text-3xl">Shop By Category</h2>
          <div className="mt-1 h-1 w-20 bg-primary"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: 'Bike Tyres', type: 'Bike', description: 'Lightweight tyres with superior grip.', icon: '🏍️' },
            { title: 'Car Tyres', type: 'Car', description: 'Comfort, durability, and road safety.', icon: '🚗' },
            { title: 'Auto Tyres', type: 'Auto', description: 'Designed for city traffic and stability.', icon: '🛺' },
            { title: 'Lorry Tyres', type: 'Lorry', description: 'Heavy-duty strength for every haul.', icon: '🚚' },
          ].map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -8, scale: 1.02, boxShadow: '0 10px 30px -10px rgba(225, 6, 0, 0.3)' }}
              className="group relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition-all duration-300"
            >
              <Link to={`/category/${item.type}`} className="absolute inset-0 z-10" />
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl transition group-hover:bg-primary group-hover:text-black duration-300">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-white group-hover:text-primary transition duration-300">{item.title}</h3>
              <p className="mt-3 text-sm text-white/70">{item.description}</p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition duration-300">
                View Catalog &rarr;
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Video Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 border-t border-white/5">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <span className="text-sm font-semibold tracking-[0.25em] text-primary uppercase">Technology Spotlight</span>
            <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight sm:text-4xl uppercase">
              Confidence in Every Turn
            </h2>
            <div className="mt-4 h-1 w-20 bg-primary"></div>
            <p className="mt-6 text-base leading-relaxed text-white/70">
              Your safety on the road depends entirely on the few square inches of rubber connecting your vehicle to the tarmac. We stock premium, high-performance tyres designed with cutting-edge technology.
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Watch this Bridgestone technology showcase to see how the Alenza Prestige tyre minimizes hydroplaning risk and delivers confident handling and grip even in the most challenging wet weather conditions.
            </p>
            <div className="mt-8">
              <Link
                to="/tyres"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-white"
              >
                Browse Our Inventory
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/50">
              <div className="relative overflow-hidden rounded-2xl pb-[56.25%]">
                <iframe
                  className="absolute inset-0 h-full w-full border-0"
                  src={`https://www.youtube.com/embed/${VIDEO_URL.match(/[?&]v=([^&]+)/)?.[1] || 'FKeM-5Xk94o'}`}
                  title="Alenza Prestige Wet Performance | Bridgestone"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal Lightbox */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#111] p-2 shadow-2xl shadow-black/80">
            {/* Close button */}
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition duration-200 text-sm font-semibold uppercase tracking-[0.18em] flex items-center gap-1"
            >
              <span>Close</span>
              <span className="text-xl">&times;</span>
            </button>
            <div className="relative overflow-hidden rounded-2xl pb-[56.25%]">
              <iframe
                className="absolute inset-0 h-full w-full border-0"
                src={`https://www.youtube.com/embed/${VIDEO_URL.match(/[?&]v=([^&]+)/)?.[1] || 'FKeM-5Xk94o'}?autoplay=1&rel=0`}
                title="TyreHub Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
