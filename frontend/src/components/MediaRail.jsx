import React, { useRef } from 'react';
import { IconPill, IconCheckCircle, IconClock, IconPlay } from './Icons';

export function MediaRail({ title, subtitle, items, onMarkTaken, onPlaySound, activeTab, badgeColor = 'netflix' }) {
  const railRef = useRef(null);

  const scroll = (direction) => {
    if (railRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      railRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
      {/* Rail Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 0.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e50914', display: 'inline-block' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              {title}
            </h3>
          </div>
          {subtitle && <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.2rem', margin: 0 }}>{subtitle}</p>}
        </div>

        {/* Scroll Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => scroll('left')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
            title="Scroll Left"
          >
            ‹
          </button>
          <button
            onClick={() => scroll('right')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
            title="Scroll Right"
          >
            ›
          </button>
        </div>
      </div>

      {/* Rail Carousel Row */}
      <div
        ref={railRef}
        className="netflix-rail hide-scrollbar"
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          padding: '0.5rem 0.25rem 1.25rem 0.25rem',
        }}
      >
        {items.map((item, idx) => {
          const isTaken = item.status === 'TAKEN' || item.taken;
          const isMissed = item.status === 'MISSED';
          const isUrgent = item.category === 'CRITICAL' || item.priority === 'HIGH';

          return (
            <div
              key={item._id || item.id || idx}
              className="netflix-card"
              style={{
                minWidth: '280px',
                maxWidth: '300px',
                flexShrink: 0,
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.9)',
                border: isUrgent ? '1px solid rgba(229, 9, 20, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
              }}
            >
              {/* Card Header & Badge */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.6rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: isTaken
                        ? 'rgba(16, 185, 129, 0.2)'
                        : isMissed
                        ? 'rgba(244, 63, 94, 0.2)'
                        : isUrgent
                        ? 'rgba(229, 9, 20, 0.25)'
                        : 'rgba(6, 182, 212, 0.2)',
                      color: isTaken
                        ? '#34d399'
                        : isMissed
                        ? '#fb7185'
                        : isUrgent
                        ? '#ff4b5c'
                        : '#38bdf8',
                      border: isTaken
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : isMissed
                        ? '1px solid rgba(244, 63, 94, 0.4)'
                        : isUrgent
                        ? '1px solid rgba(229, 9, 20, 0.5)'
                        : '1px solid rgba(6, 182, 212, 0.4)',
                    }}
                  >
                    {isTaken ? '✓ Taken' : isMissed ? '✕ Missed' : item.time || item.category || 'Scheduled'}
                  </span>

                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <IconClock className="w-4 h-4" color="#64748b" />
                    {item.time || item.scheduledTime || 'Today'}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name || item.medicineName || item.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, margin: '0.2rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.dosage || item.description || item.instructions || '1 Dose after meal'}
                </p>
              </div>

              {/* Card Thumbnail / Visual Box */}
              <div
                style={{
                  width: '100%',
                  height: '84px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: isTaken ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconPill className="w-5 h-5" color={isTaken ? '#34d399' : '#06b6d4'} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>{item.form || 'Tablet / Capsule'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                      {item.instructions || 'Take with water'}
                    </div>
                  </div>
                </div>

                {/* Play Sound Button */}
                {onPlaySound && (
                  <button
                    onClick={() => onPlaySound(item)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(6, 182, 212, 0.2)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 1,
                      flexShrink: 0,
                    }}
                    title="Test Audio Alarm Sound"
                  >
                    <IconPlay className="w-4 h-4" color="#38bdf8" />
                  </button>
                )}
              </div>

              {/* Card Action Controls */}
              <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {isTaken ? (
                  <div style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.8rem', fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <IconCheckCircle className="w-4 h-4" color="#34d399" /> Dose Complete
                  </div>
                ) : (
                  <button
                    onClick={() => onMarkTaken && onMarkTaken(item._id || item.id)}
                    className="btn-netflix"
                    style={{
                      width: '100%',
                      padding: '0.55rem',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <IconCheckCircle className="w-4 h-4" color="#ffffff" /> Mark Taken (+15 pts)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


