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
    <div className="mb-10 relative group">
      {/* Rail Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              {title}
            </h3>
          </div>
          {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all shadow-md active:scale-95"
            title="Scroll Left"
          >
            ‹
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all shadow-md active:scale-95"
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
      >
        {items.map((item, idx) => {
          const isTaken = item.status === 'TAKEN' || item.taken;
          const isMissed = item.status === 'MISSED';
          const isUrgent = item.category === 'CRITICAL' || item.priority === 'HIGH';

          return (
            <div
              key={item._id || item.id || idx}
              className={`netflix-card min-w-[280px] max-w-[320px] flex-shrink-0 p-5 flex flex-col justify-between ${
                isUrgent ? 'netflix-card-red' : ''
              }`}
            >
              {/* Card Header & Badge */}
              <div className="relative mb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    isTaken
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isMissed
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : isUrgent
                      ? 'bg-red-600/30 text-red-400 border border-red-500/50'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    {isTaken ? '✓ Taken' : isMissed ? '✕ Missed' : item.time || item.category || 'Scheduled'}
                  </span>

                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <IconClock className="w-3.5 h-3.5 text-slate-500" />
                    {item.time || item.scheduledTime || 'Today'}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white tracking-wide truncate">
                  {item.name || item.medicineName || item.title}
                </h4>
                <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                  {item.dosage || item.description || item.instructions || '1 Dose after meal'}
                </p>
              </div>

              {/* Card Thumbnail / Visual Box */}
              <div className="w-full h-24 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-3 mb-4 flex items-center justify-between relative overflow-hidden group/thumb">
                <div className="flex items-center gap-3 z-10">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isTaken ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <IconPill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{item.form || 'Tablet / Capsule'}</div>
                    <div className="text-[11px] text-slate-400">{item.instructions || 'Take with water'}</div>
                  </div>
                </div>

                {/* Play Sound Button Hover */}
                {onPlaySound && (
                  <button
                    onClick={() => onPlaySound(item)}
                    className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500 hover:text-white flex items-center justify-center transition-all z-10 active:scale-90"
                    title="Test Audio Alarm Sound"
                  >
                    <IconPlay className="w-4 h-4 ml-0.5" />
                  </button>
                )}

                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              </div>

              {/* Card Action Controls */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                {isTaken ? (
                  <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold text-center flex items-center justify-center gap-1.5">
                    <IconCheckCircle className="w-4 h-4" /> Dose Complete
                  </div>
                ) : (
                  <button
                    onClick={() => onMarkTaken && onMarkTaken(item._id || item.id)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs hover:from-red-500 hover:to-rose-500 shadow-md hover:shadow-red-600/40 flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <IconCheckCircle className="w-4 h-4" /> Mark Taken (+15 pts)
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

