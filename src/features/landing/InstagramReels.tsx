import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Volume2, VolumeX, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { fadeInUp } from '../../lib/framer';
import { homeService } from '../../services/homeService';

interface Reel {
  id: string;
  videoUrl: string;
  likes: string;
  comments: string;
  title: string;
  views: string;
}

export const InstagramReels: React.FC = () => {
  const [hoveredReelId, setHoveredReelId] = useState<string | null>(null);
  const [muted, setMuted] = useState<boolean>(true);
  const [isSectionInView, setIsSectionInView] = useState<boolean>(false);

  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const DEFAULT_REELS: Reel[] = [
    {
      id: 'r1',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chocolate-pouring-on-a-cake-34293-large.mp4',
      likes: '14.2K',
      comments: '348',
      views: '124K views',
      title: 'Velvety gold. Pouring our signature dark chocolate glaze. 🍫✨ #chovique #chocolatier',
    },
    {
      id: 'r2',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-melted-chocolate-on-a-muffin-34289-large.mp4',
      likes: '9.8K',
      comments: '189',
      views: '85K views',
      title: 'Handcrafting our signature pralines with precision. ☕👌 #beantobar #premiumcraft',
    },
    {
      id: 'r3',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-slow-motion-chocolate-fountain-34292-large.mp4',
      likes: '24.5K',
      comments: '682',
      views: '210K views',
      title: 'Pure indulgence. Melted single-origin cacao cascade. 🍫🌊 #cacaolove #darkchocolate',
    },
    {
      id: 'r4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-chocolate-sauce-flowing-34294-large.mp4',
      likes: '18.9K',
      comments: '412',
      views: '165K views',
      title: 'Tempering organic chocolate for our artisan ganache truffles. ✨🍫 #chocolatier',
    },
  ];

  const [reelsData, setReelsData] = useState<Reel[]>(DEFAULT_REELS);

  useEffect(() => {
    homeService
      .getReels()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((r: any) => ({
            id: String(r.id),
            videoUrl: r.videoUrl || r.video_url,
            likes: String(r.likes ?? '0'),
            comments: String(r.comments ?? '0'),
            views: typeof r.views === 'number' ? `${r.views.toLocaleString()} views` : (r.views || '0 views'),
            title: r.title || 'Artisanal chocolate creations by Chovique.',
          }));
          setReelsData(mapped);
        }
      })
      .catch(() => {
        // Keep default reels
      });
  }, []);

  // Section visibility observer to pause when outside viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsSectionInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pause all videos when section scrolls out of view
  useEffect(() => {
    if (!isSectionInView) {
      Object.values(videoRefs.current).forEach((vid) => {
        if (vid && !vid.paused) vid.pause();
      });
      setHoveredReelId(null);
    }
  }, [isSectionInView]);

  // Hover handlers: play on mouse-enter, pause on mouse-leave
  const handleReelMouseEnter = (id: string) => {
    if (!isSectionInView) return;
    // Pause any currently playing reel
    Object.entries(videoRefs.current).forEach(([reelId, vid]) => {
      if (reelId !== id && vid && !vid.paused) vid.pause();
    });
    const vid = videoRefs.current[id];
    if (vid) {
      vid.muted = muted;
      vid.play().catch(() => {
        vid.muted = true;
        vid.play().catch(() => {});
      });
    }
    setHoveredReelId(id);
  };

  const handleReelMouseLeave = (id: string) => {
    const vid = videoRefs.current[id];
    if (vid && !vid.paused) vid.pause();
    setHoveredReelId(null);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = Math.max(304, clientWidth * 0.75);
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="instagram-reels"
      style={{
        padding: 'var(--section-padding) 0',
        background: 'var(--gradient-section-7)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        {/* Header matching Explore Our Collection styling */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span className="section-label" style={{ justifyContent: 'center' }}>
            Social Buzz
          </span>
          <h2 className="section-title">
            Trending on <span className="gold">Instagram</span>
          </h2>
          <p className="section-subtitle">
            Catch a glimpse of our artisanal process, stories, and customer-favorite moments on social media.
          </p>
        </motion.div>

        {/* Inline CSS to hide scrollbars */}
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @media (max-width: 640px) {
            .reels-carousel-wrapper {
              padding: 0 40px !important;
            }
            .reels-card-item {
              flex: 0 0 250px !important;
              width: 250px !important;
            }
          }
        `}</style>

        {/* Slider Container Wrapper */}
        <div className="reels-carousel-wrapper" style={{ position: 'relative', width: '100%', padding: '0 50px' }}>
          {/* Left Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              scroll('left');
            }}
            aria-label="Scroll Left"
            style={{
              position: 'absolute',
              left: '0px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cream)',
              zIndex: 10,
              boxShadow: 'var(--glass-shadow)',
              backdropFilter: 'blur(5px)',
              transition: 'background 0.3s, color 0.3s, border-color 0.3s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.color = 'var(--cream)';
            }}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Horizontal Reel Slider */}
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              padding: '10px 0 30px 0',
            }}
            className="hide-scrollbar"
          >
            {reelsData.map((reel) => {
              const isHovered = hoveredReelId === reel.id;

              return (
                <motion.div
                  key={reel.id}
                  layout
                  className="reels-card-item"
                  style={{
                    flex: '0 0 280px',
                    width: '280px',
                    maxWidth: '280px',
                    height: '480px',
                    scrollSnapAlign: 'start',
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: '#0a0a0a',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--glass-shadow)',
                    cursor: 'pointer',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={() => handleReelMouseEnter(reel.id)}
                  onMouseLeave={() => handleReelMouseLeave(reel.id)}
                >
                  {/* HTML5 Video element with auto-play */}
                  <video
                    ref={(el) => {
                      videoRefs.current[reel.id] = el;
                    }}
                    src={reel.videoUrl}
                    loop
                    muted={muted}
                    playsInline
                    preload="metadata"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Gradient & Overlay UI */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.4) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '16px',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* Top overlay row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
                      <span
                        style={{
                          background: 'rgba(201, 168, 76, 0.25)',
                          backdropFilter: 'blur(8px)',
                          color: 'var(--gold-light)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: '1px solid rgba(201, 168, 76, 0.4)',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                        }}
                      >
                        PROMOTED REEL
                      </span>

                      {/* Mute button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMuted((prev) => !prev);
                        }}
                        aria-label={muted ? 'Unmute video' : 'Mute video'}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)',
                          transition: 'background 0.2s, border-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--gold)';
                          e.currentTarget.style.color = 'var(--gold)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.color = 'white';
                        }}
                      >
                        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    </div>

                    {/* Center Play icon when not hovered */}
                    {!isHovered && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(20, 15, 10, 0.75)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid var(--gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--gold-light)',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                          pointerEvents: 'none',
                        }}
                      >
                        <Play size={22} fill="currentColor" style={{ marginLeft: '3px' }} />
                      </div>
                    )}

                    {/* Bottom details overlay */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'auto' }}>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--cream)',
                          fontWeight: 500,
                          lineHeight: 1.4,
                          margin: 0,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {reel.title}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Heart size={14} fill="#ff4b72" color="#ff4b72" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cream)' }}>
                              {reel.likes}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MessageCircle size={14} color="var(--gold-light)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cream)' }}>
                              {reel.comments}
                            </span>
                          </div>
                        </div>

                        <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.65)', fontWeight: 500 }}>
                          {reel.views}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              scroll('right');
            }}
            aria-label="Scroll Right"
            style={{
              position: 'absolute',
              right: '0px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cream)',
              zIndex: 10,
              boxShadow: 'var(--glass-shadow)',
              backdropFilter: 'blur(5px)',
              transition: 'background 0.3s, color 0.3s, border-color 0.3s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.color = 'var(--cream)';
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default InstagramReels;
