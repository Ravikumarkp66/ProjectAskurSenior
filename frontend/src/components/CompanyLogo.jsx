import React from 'react';

// Crisp SVG Company Logos & Fallbacks
const COMPANY_LOGOS = {
  amazon: (
    <svg viewBox="0 0 100 60" className="w-full h-full text-[#FF9900]" fill="currentColor">
      {/* Amazon A with Smile Arrow */}
      <path d="M57.6 42.4c-8.9 6.5-21.8 10-33 10-15.5 0-29.4-5.8-39.9-15.5-1-0.9-0.2-2.1 1.1-1.4 15.1 8.7 33.7 13.9 52.8 13.9 9.8 0 20.3-1.6 29.8-4.9 1.4-0.5 2.5 1 1.2 2.1z" fill="#FF9900" />
      <path d="M60.5 38.6c-0.8-1-5.1-0.5-7.1-0.3-0.6 0.1-0.7-0.4-0.1-0.8 3.8-2.6 10.1-1.9 11-0.7 0.9 1.1-0.2 7.5-3.8 10.3-0.5 0.4-1 0.2-0.8-0.4 0.7-1.9 1.6-6.1 0.8-7.1z" fill="#FF9900" />
      <text x="50" y="30" textAnchor="middle" fontSize="24" fontFamily="system-ui, sans-serif" fontWeight="900" fill="#111">
        amazon
      </text>
    </svg>
  ),
  'morgan stanley': (
    <svg viewBox="0 0 100 100" className="w-full h-full text-[#002B49]" fill="currentColor">
      <rect width="100" height="100" rx="16" fill="#002B49" />
      <path d="M20 70V30l20 30 20-30v40h-8V43L39 63h-2L24 43v27h-4zm42 0V30h8v40h-8z" fill="#FFFFFF" />
      <text x="50" y="85" textAnchor="middle" fontSize="10" fontFamily="system-ui, sans-serif" fontWeight="800" fill="#00A3E0">
        MORGAN STANLEY
      </text>
    </svg>
  ),
  dish: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#EC1C24" />
      <text x="50" y="58" textAnchor="middle" fontSize="26" fontFamily="system-ui, sans-serif" fontWeight="900" fill="#FFFFFF">
        dish
      </text>
      <circle cx="76" cy="36" r="5" fill="#FFFFFF" />
    </svg>
  ),
  'dish company': (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#EC1C24" />
      <text x="50" y="58" textAnchor="middle" fontSize="26" fontFamily="system-ui, sans-serif" fontWeight="900" fill="#FFFFFF">
        dish
      </text>
      <circle cx="76" cy="36" r="5" fill="#FFFFFF" />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  ),
  microsoft: (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 170 170" className="w-full h-full" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.49-6.1-3.18-2.64-7.07-7.24-11.68-13.82-7.83-11.22-13.87-23.77-18.12-37.64-4.25-13.88-6.38-27.18-6.38-39.9 0-14.75 3.52-27.23 10.57-37.44s16.14-15.42 27.27-15.67c4.69 0 10.02 1.25 15.98 3.76 5.96 2.51 10.1 3.77 12.41 3.77 1.85 0 6.1-1.32 12.74-3.95 6.64-2.64 12.18-3.76 16.63-3.35 12.35.97 22.18 5.6 29.49 13.89-10.97 6.64-16.32 15.82-16.06 27.53.26 9.11 3.76 16.8 10.5 23.07 6.74 6.27 14.88 9.77 24.42 10.5-2.51 7.69-5.96 15.34-10.35 22.95zM119.22 31.09c0-7.43 2.65-14.43 7.95-21 5.3-6.57 11.85-10.09 19.65-10.57.13.93.19 1.72.19 2.38 0 7.3-2.71 14.37-8.13 21.21-5.42 6.84-12.01 10.43-19.78 10.77-.13-1.06-.2-2-.2-2.79z" fill="#000" />
    </svg>
  ),
  flipkart: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#2874F0" />
      <path d="M25 25h50v50H25z" fill="none" />
      <text x="50" y="65" textAnchor="middle" fontSize="42" fontFamily="sans-serif" fontWeight="900" fill="#FFE500">
        F
      </text>
    </svg>
  ),
  cisco: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#1BA0D7" />
      <path d="M25 45v15M35 35v25M45 25v35M55 25v35M65 35v25M75 45v15" stroke="#FFF" strokeWidth="6" strokeLinecap="round" />
    </svg>
  ),
  oracle: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#F80000" />
      <text x="50" y="60" textAnchor="middle" fontSize="18" fontFamily="sans-serif" fontWeight="900" fill="#FFF">
        ORACLE
      </text>
    </svg>
  ),
  adobe: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#FF0000" />
      <path d="M35 75L50 30l15 45h-10l-5-15H45l-5 15H35z" fill="#FFF" />
    </svg>
  ),
  tcs: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#001F5B" />
      <text x="50" y="60" textAnchor="middle" fontSize="24" fontFamily="sans-serif" fontWeight="900" fill="#FFF">
        TCS
      </text>
    </svg>
  ),
  infosys: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#007CC3" />
      <text x="50" y="60" textAnchor="middle" fontSize="20" fontFamily="sans-serif" fontWeight="900" fill="#FFF">
        Infosys
      </text>
    </svg>
  ),
  wipro: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#132B45" />
      <circle cx="50" cy="50" r="25" fill="#E82C2A" />
      <text x="50" y="56" textAnchor="middle" fontSize="14" fontFamily="sans-serif" fontWeight="900" fill="#FFF">
        wipro
      </text>
    </svg>
  ),
  accenture: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect width="100" height="100" rx="16" fill="#A100FF" />
      <path d="M35 55l20-20 20 20h-12l-8-8-8 8H35z" fill="#FFF" />
    </svg>
  )
};

// Generates dynamic 2-letter monogram background gradient for fallback
const getMonogramDetails = (name = '') => {
  const clean = name.trim().toUpperCase();
  if (!clean) return { initials: 'CO', bg: 'from-purple-600 to-indigo-600' };

  const words = clean.split(/\s+/);
  let initials = 'CO';
  if (words.length >= 2) {
    initials = words[0][0] + words[1][0];
  } else if (clean.length >= 2) {
    initials = clean.substring(0, 2);
  } else {
    initials = clean[0] || 'C';
  }

  const gradients = [
    'from-purple-600 to-indigo-600',
    'from-blue-600 to-cyan-500',
    'from-emerald-600 to-teal-500',
    'from-rose-600 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-violet-600 to-fuchsia-600'
  ];

  const charCodeSum = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const bg = gradients[charCodeSum % gradients.length];

  return { initials, bg };
};

const CompanyLogo = ({ company = '', logoUrl = '', className = 'w-12 h-12' }) => {
  const key = company.toLowerCase().trim();

  // 1. Check exact SVG Preset
  if (COMPANY_LOGOS[key]) {
    return <div className={`${className} shrink-0`}>{COMPANY_LOGOS[key]}</div>;
  }

  // 2. Check partial matches (e.g. "Amazon Inc" -> amazon)
  const matchedKey = Object.keys(COMPANY_LOGOS).find(k => key.includes(k) || k.includes(key));
  if (matchedKey) {
    return <div className={`${className} shrink-0`}>{COMPANY_LOGOS[matchedKey]}</div>;
  }

  // 3. Crisp Vector Fallback with Monogram
  const { initials, bg } = getMonogramDetails(company);

  return (
    <div className={`${className} shrink-0 rounded-2xl bg-gradient-to-br ${bg} p-0.5 shadow-md flex items-center justify-center`}>
      <div className="w-full h-full rounded-[14px] bg-black/20 backdrop-blur-sm flex items-center justify-center">
        <span className="text-white font-black text-xs tracking-wider">{initials}</span>
      </div>
    </div>
  );
};

export default CompanyLogo;
