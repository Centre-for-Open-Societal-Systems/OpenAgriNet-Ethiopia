import React from 'react';

const ATILogo = ({ className = '' }) => (
  <svg
    className={`ati-header-logo-container ${className}`}
    viewBox="-10 -10 450 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Icon */}
    <g className="ati-logo-icon" transform="translate(195, -5) scale(0.65)">
      {/* Inner & Outer Sun Arcs */}
      <path d="M 18 55 A 32 32 0 0 1 82 55 Z" fill="#F59E0B" />
      <path d="M 32 55 A 18 18 0 0 1 68 55 Z" fill="#FDE047" />

      {/* Left/Bottom Leaf */}
      <path d="M 10 58 A 38 25 0 0 1 45 90 A 38 25 0 0 1 10 58 Z" fill="#84CC16" opacity="0.95" />
      {/* Middle Leaf */}
      <path d="M 28 53 A 40 25 0 0 1 68 88 A 40 25 0 0 1 28 53 Z" fill="#22C55E" opacity="0.95" />
      {/* Right/Top Leaf */}
      <path d="M 46 48 A 42 25 0 0 1 92 85 A 42 25 0 0 1 46 48 Z" fill="#15803D" opacity="0.95" />
    </g>

    {/* Top Row: Ethiopian + ATI */}
    <text className="ati-logo-text-ethiopian" x="0" y="45" fontFamily="Georgia, serif" fontSize="46px" fill="currentColor">Ethiopian</text>
    <text className="ati-logo-text-ati" x="270" y="45" fontFamily="Georgia, serif" fontSize="46px" fill="currentColor">ATI</text>

    {/* Middle Row: English Name */}
    <text className="ati-logo-text-english" x="2" y="80" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="23.5px" fill="currentColor" letterSpacing="0.2px">
      Agricultural Transformation Institute
    </text>

    {/* Bottom Row: Amharic Name */}
    <text className="ati-logo-text-amharic" x="6" y="112" fontFamily="sans-serif" fontSize="19px" fill="currentColor" letterSpacing="0.5px">
      የኢትዮጵያ ግብርና ትራንስፎርሜሽን ኢንስቲትዩት
    </text>
  </svg>
);

export default ATILogo;
