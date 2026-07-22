import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { scaleUp } from '../../lib/framer';

interface Reel {
  id: string;
  videoUrl: string;
  likes: string;
  comments: string;
  title: string;
  views: string;
}

export const InstagramReels: React.FC = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const reelsData: Reel[] = [
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
  ];

  const handlePlayPause = (id: string) => {
    const video = videoRefs.current[id];
    if (!video) return;

    if (playingId === id) {
      video.pause();
      setPlayingId(null);
    } else {
      // Pause currently playing video
      if (playingId) {
        const currentPlayingVideo = videoRefs.current[playingId];
        if (currentPlayingVideo) currentPlayingVideo.pause();
      }
      video.play().catch((err) => console.log('Video play error:', err));
      setPlayingId(id);
    }
  };

  return (
    <section
      style={{
        padding: 'var(--section-padding) 0',
        background: 'var(--gradient-section-7)',
        overflow: 'hidden',
      }}
    >
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="section-label" style={{ justifyContent: 'center' }}>Social Buzz</span>
          <h2 className="section-title">
            Trending on <span className="gold">Instagram</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Catch a glimpse of our artisanal process, stories, and customer-favorite moments on social media.
          </p>
        </div>

        {/* Reels Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
            justifyContent: 'center',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          {reelsData.map((reel, idx) => (
            <motion.div
              key={reel.id}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={scaleUp}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              style={{
                position: 'relative',
                aspectRatio: '9/16',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--glass-shadow)',
                border: '1px solid var(--glass-border)',
                background: '#0a0a0a',
                cursor: 'pointer',
              }}
              onClick={() => handlePlayPause(reel.id)}
            >
              {/* HTML5 Video element */}
              <video
                ref={(el) => {
                  videoRefs.current[reel.id] = el;
                }}
                src={reel.videoUrl}
                loop
                muted={muted}
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {/* Video Overlay controls */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.85) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                }}
              >
                {/* Top Overlay info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      background: 'rgba(201, 168, 76, 0.25)',
                      backdropFilter: 'blur(8px)',
                      color: 'var(--gold-light)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '20px',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                      letterSpacing: '1px',
                    }}
                  >
                    PROMOTED REEL
                  </span>

                  {/* Mute button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMuted(!muted);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                </div>

                {/* Play Button visual overlay */}
                {playingId !== reel.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(var(--dark-chocolate-rgb), 0.65)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold-light)',
                    }}
                  >
                    <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                  </div>
                )}

                {/* Bottom details overlay */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--cream)', fontWeight: 500, lineHeight: 1.4 }}>
                    {reel.title}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4b72' }}>
                        <Heart size={16} fill="#ff4b72" />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cream)' }}>{reel.likes}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-light)' }}>
                        <MessageCircle size={16} />
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--cream)' }}>{reel.comments}</span>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.72rem', color: 'var(--grey-light)' }}>
                      {reel.views}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramReels;
