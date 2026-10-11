import React from 'react';

/**
 * SplitYaar Brand Logo
 * Features the signature geometric Y-Split emblem with electric cyan/emerald gradients
 */
export default function Logo({ size = 'md', showText = true, className = '' }) {
  // Size mapping
  const sizeMap = {
    sm: { img: 'w-7 h-7', text: 'text-sm', badge: 'rounded-full' },
    md: { img: 'w-8 h-8', text: 'text-base', badge: 'rounded-full' },
    lg: { img: 'w-11 h-11', text: 'text-xl', badge: 'rounded-full' },
    xl: { img: 'w-16 h-16', text: 'text-2xl', badge: 'rounded-full' },
  };

  const { img, text, badge } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon Badge */}
      <div className={`relative ${img} ${badge} overflow-hidden shadow-md shadow-blue-600/15 border border-blue-400/30 bg-[#0066cc] flex items-center justify-center shrink-0 group`}>
        <img
          src="/logo.png"
          alt="SplitYaar Logo"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // Fallback SVG if image not found
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Subtle highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <span className={`font-bold tracking-tight ${text} flex items-center leading-none`}>
          <span className="text-white font-extrabold tracking-tight">Split</span>
          <span className="text-[#2997ff] font-black tracking-tight ml-0.5">
            Yaar
          </span>
        </span>
      )}
    </div>
  );
}
