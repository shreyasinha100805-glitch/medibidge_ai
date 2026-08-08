import React, { useState } from 'react';

/**
 * Interactive 7-Day Stacked Daily Trend Bar Chart (SVG)
 */
export const DailyTrendBarChart = ({ data = [] }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Fallback demo 7-day trend if empty
  const trendData = data.length > 0 ? data : [
    { day: 'Mon', taken: 3, missed: 0, total: 3, date: 'Aug 2' },
    { day: 'Tue', taken: 3, missed: 0, total: 3, date: 'Aug 3' },
    { day: 'Wed', taken: 2, missed: 1, total: 3, date: 'Aug 4' },
    { day: 'Thu', taken: 3, missed: 0, total: 3, date: 'Aug 5' },
    { day: 'Fri', taken: 1, missed: 2, total: 3, date: 'Aug 6' },
    { day: 'Sat', taken: 3, missed: 0, total: 3, date: 'Aug 7' },
    { day: 'Sun', taken: 2, missed: 1, total: 3, date: 'Aug 8' },
  ];

  const maxDoses = Math.max(...trendData.map(d => d.total || 3), 4);
  const chartHeight = 160;

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>7-Day Adherence Trend History</h4>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>Daily breakdown of doses taken vs missed</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
            <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '3px' }} /> Taken
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb7185' }}>
            <span style={{ width: '10px', height: '10px', background: '#f43f5e', borderRadius: '3px' }} /> Missed
          </span>
        </div>
      </div>

      <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.8rem', padding: '0 0.5rem', position: 'relative' }}>
        
        {trendData.map((item, idx) => {
          const takenHeight = (item.taken / maxDoses) * chartHeight;
          const missedHeight = (item.missed / maxDoses) * chartHeight;
          const totalPct = Math.round((item.taken / (item.total || 1)) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'pointer' }}
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-45px',
                    zIndex: 20,
                    background: '#0f172a',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#38bdf8', fontWeight: 800 }}>{item.day} ({item.date || 'Today'})</div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.7rem' }}>
                    {item.taken} Taken • {item.missed} Missed ({totalPct}%)
                  </div>
                </div>
              )}

              {/* Stacked Bar Container */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '36px',
                  height: `${chartHeight}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  border: isHovered ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                  transform: isHovered ? 'scaleY(1.03)' : 'scaleY(1)',
                }}
              >
                {/* Missed Portion (Rose) */}
                {missedHeight > 0 && (
                  <div
                    style={{
                      height: `${missedHeight}px`,
                      background: 'linear-gradient(180deg, #fb7185, #f43f5e)',
                      transition: 'height 0.5s ease',
                    }}
                  />
                )}

                {/* Taken Portion (Emerald) */}
                {takenHeight > 0 && (
                  <div
                    style={{
                      height: `${takenHeight}px`,
                      background: 'linear-gradient(180deg, #34d399, #10b981)',
                      transition: 'height 0.5s ease',
                    }}
                  />
                )}
              </div>

              {/* Day Label */}
              <span style={{ marginTop: '0.6rem', fontSize: '0.75rem', fontWeight: 700, color: isHovered ? '#38bdf8' : '#94a3b8' }}>
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Animated Donut Radial Gauge SVG
 */
export const AdherenceDonutGauge = ({ percentage = 85, label = "30-Day Score", size = 160 }) => {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color = percentage >= 80 ? '#34d399' : percentage >= 60 ? '#fbbf24' : '#fb7185';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {/* Outer glow filter */}
          <defs>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="12"
            fill="transparent"
          />

          {/* Value Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#gaugeGlow)"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>

        {/* Center Text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1 }}>
            {percentage}%
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};
