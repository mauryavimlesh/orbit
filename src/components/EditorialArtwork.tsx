import React from 'react';
import { ArtworkTheme } from '../types/orbit';

interface EditorialArtworkProps {
  theme: ArtworkTheme;
  className?: string;
  variant?: 'hero' | 'card' | 'thumb';
}

export const EditorialArtwork: React.FC<EditorialArtworkProps> = ({
  theme,
  className = '',
  variant = 'card',
}) => {
  switch (theme) {
    case 'quantum_twilight':
      return (
        <div
          className={`relative overflow-hidden select-none bg-[#1B1326] ${className}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1200 675"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full object-cover"
          >
            <defs>
              <linearGradient id="qt-sky" x1="0" y1="0" x2="0.2" y2="1">
                <stop offset="0%" stopColor="#3B234A" />
                <stop offset="35%" stopColor="#8E4A59" />
                <stop offset="68%" stopColor="#D67C63" />
                <stop offset="100%" stopColor="#120E1A" />
              </linearGradient>
              <linearGradient id="qt-cloud" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5A682" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#B85D6F" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#462849" stopOpacity="0.9" />
              </linearGradient>
              <radialGradient id="qt-glow" cx="0.65" cy="0.35" r="0.45">
                <stop offset="0%" stopColor="#FFE0B5" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#E68369" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#1B1326" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Warm Dusk Sky */}
            <rect width="1200" height="675" fill="url(#qt-sky)" />
            <circle cx="780" cy="240" r="380" fill="url(#qt-glow)" />

            {/* Subtle Quantum Surface Code Lattice in the Twilight Sky */}
            <g stroke="#FFD8C2" strokeOpacity="0.18" strokeWidth="1.2">
              <line x1="520" y1="60" x2="980" y2="280" />
              <line x1="580" y1="40" x2="1040" y2="260" />
              <line x1="460" y1="90" x2="920" y2="310" />
              <line x1="680" y1="40" x2="480" y2="320" />
              <line x1="780" y1="60" x2="580" y2="340" />
              <line x1="880" y1="80" x2="680" y2="360" />
            </g>
            <g fill="#FFF2E2" fillOpacity="0.65">
              <circle cx="655" cy="125" r="4.5" />
              <circle cx="732" cy="162" r="5.5" />
              <circle cx="810" cy="198" r="4" />
              <circle cx="595" cy="155" r="4" />
              <circle cx="672" cy="191" r="6" fill="#34D399" />
              <circle cx="750" cy="228" r="4.5" />
            </g>

            {/* Billowing Warm Editorial Clouds matching reference image */}
            <path
              d="M-60,340 Q80,210 240,260 Q360,150 520,230 Q680,140 840,220 Q1020,120 1160,210 L1260,250 L1260,550 L-60,550 Z"
              fill="url(#qt-cloud)"
            />
            <path
              d="M-60,410 Q140,290 320,340 Q510,250 710,330 Q920,240 1240,340 L1240,600 L-60,600 Z"
              fill="#351F39"
              fillOpacity="0.78"
            />

            {/* Cosmic Whale / Orbital Arc Silhouette in upper right (nod to reference art) */}
            <path
              d="M1040,95 C1095,65 1155,75 1185,120 C1150,135 1110,155 1085,195 C1070,175 1080,140 1055,130 C1035,122 1020,135 1010,145 C1015,120 1025,105 1040,95 Z"
              fill="#231836"
              opacity="0.88"
            />

            {/* Observatory Terrace / Train Roof Silhouette at Bottom */}
            <path
              d="M0,450 Q600,405 1200,455 L1200,675 L0,675 Z"
              fill="#17121E"
            />
            <path
              d="M0,495 L1200,495 L1200,675 L0,675 Z"
              fill="#0E0B14"
            />
            {/* Architectural Windows on lower structure */}
            <g fill="#1F192B" stroke="#3B2E4A" strokeWidth="2">
              <rect x="340" y="525" width="220" height="110" rx="10" />
              <rect x="610" y="525" width="240" height="110" rx="10" />
              <rect x="900" y="525" width="210" height="110" rx="10" />
            </g>

            {/* Contemplative Researcher & Companion Silhouette on Roof */}
            <g fill="#1F1421" stroke="#F5A682" strokeOpacity="0.35" strokeWidth="1.2">
              {/* Companion silhouette */}
              <path d="M542,425 C542,395 556,375 566,375 C576,375 584,395 584,425 Z" />
              <circle cx="565" cy="366" r="11" />
              {/* Reclining / Observing Researcher */}
              <path d="M640,425 Q685,385 745,412 L795,365 L825,425 Z" />
              <circle cx="662" cy="382" r="16" />
            </g>
          </svg>
          {variant === 'hero' && (
            <div className="absolute inset-0 bg-gradient-to-t from-[#09080D] via-[#09080D]/55 to-transparent" />
          )}
        </div>
      );

    case 'geospatial_splatting':
      return (
        <div
          className={`relative overflow-hidden select-none bg-[#1B2234] ${className}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 600 720"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full object-cover"
          >
            <defs>
              <linearGradient id="gs-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9ED2D6" />
                <stop offset="42%" stopColor="#E8B4B8" />
                <stop offset="75%" stopColor="#4A4E69" />
                <stop offset="100%" stopColor="#11131F" />
              </linearGradient>
            </defs>
            <rect width="600" height="720" fill="url(#gs-sky)" />
            {/* Soft clouds */}
            <path
              d="M0,220 Q150,150 310,200 Q460,130 600,190 L600,420 L0,420 Z"
              fill="#F3D1C8"
              fillOpacity="0.45"
            />
            {/* Isometric Town / Architecture Roofs */}
            <g stroke="#FFD6BA" strokeOpacity="0.55" strokeWidth="1.5" fill="#2B334B">
              <polygon points="60,440 180,350 300,440 300,660 60,660" fill="#373F5B" />
              <polygon points="180,350 340,320 440,410 300,440" fill="#5C5366" />
              <polygon points="300,440 460,370 570,450 570,680 300,680" fill="#242B42" />
            </g>
            {/* 3D Gaussian Splat Ellipsoids & Wireframe Scan Overlay */}
            <g fill="#64DFDF" fillOpacity="0.45">
              <ellipse cx="180" cy="350" rx="22" ry="8" transform="rotate(-15 180 350)" />
              <ellipse cx="250" cy="390" rx="28" ry="10" transform="rotate(12 250 390)" />
              <ellipse cx="380" cy="375" rx="25" ry="9" transform="rotate(-20 380 375)" />
              <ellipse cx="450" cy="420" rx="18" ry="7" />
              <ellipse cx="140" cy="480" rx="30" ry="11" fill="#F4A261" fillOpacity="0.5" />
            </g>
            {/* Warm Glowing Windows */}
            <g fill="#F6BD60" fillOpacity="0.8">
              <rect x="105" y="475" width="28" height="38" rx="4" />
              <rect x="155" y="475" width="28" height="38" rx="4" />
              <rect x="355" y="465" width="32" height="42" rx="4" />
              <rect x="415" y="465" width="32" height="42" rx="4" />
            </g>
            <rect y="360" width="600" height="360" fill="url(#gs-sky)" opacity="0.18" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E15] via-[#0D0E15]/45 to-transparent" />
        </div>
      );

    case 'biotech_bohr':
      return (
        <div
          className={`relative overflow-hidden select-none bg-[#162332] ${className}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 600 720"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full object-cover"
          >
            <defs>
              <linearGradient id="bb-sky" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="#264653" />
                <stop offset="45%" stopColor="#3D5A80" />
                <stop offset="80%" stopColor="#E07A5F" />
                <stop offset="100%" stopColor="#121624" />
              </linearGradient>
            </defs>
            <rect width="600" height="720" fill="url(#bb-sky)" />
            {/* Starry / Molecular Particles */}
            <g fill="#F4F1DE" fillOpacity="0.65">
              <circle cx="110" cy="110" r="3" />
              <circle cx="240" cy="80" r="2.5" />
              <circle cx="420" cy="130" r="3.5" />
              <circle cx="510" cy="90" r="2" />
              <circle cx="340" cy="190" r="4" fill="#80ED99" />
            </g>
            {/* Sigmoidal Bohr Curve & Allosteric Heme Representation */}
            <path
              d="M 60 540 C 180 530, 220 260, 520 220"
              fill="none"
              stroke="#80ED99"
              strokeWidth="4"
              strokeOpacity="0.75"
            />
            <path
              d="M 60 540 C 240 535, 310 310, 540 250"
              fill="none"
              stroke="#F4A261"
              strokeWidth="3.5"
              strokeDasharray="8 6"
              strokeOpacity="0.85"
            />
            {/* Stylized Cellular / Architectural Silhouettes at Base */}
            <ellipse cx="190" cy="430" rx="68" ry="42" fill="#E76F51" fillOpacity="0.65" />
            <ellipse cx="190" cy="430" rx="32" ry="18" fill="#264653" fillOpacity="0.6" />
            <ellipse cx="390" cy="360" rx="58" ry="36" fill="#E76F51" fillOpacity="0.75" />
            <ellipse cx="390" cy="360" rx="26" ry="14" fill="#264653" fillOpacity="0.6" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D101A] via-[#0D101A]/45 to-transparent" />
        </div>
      );

    case 'sparse_attention':
      return (
        <div
          className={`relative overflow-hidden select-none bg-[#23192D] ${className}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 600 720"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full object-cover"
          >
            <defs>
              <linearGradient id="sa-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F2B5D4" />
                <stop offset="40%" stopColor="#E5989B" />
                <stop offset="70%" stopColor="#355070" />
                <stop offset="100%" stopColor="#121420" />
              </linearGradient>
            </defs>
            <rect width="600" height="720" fill="url(#sa-sky)" />
            {/* Mountain / Twilight Ridges */}
            <polygon points="0,440 160,310 340,410 510,280 600,360 600,720 0,720" fill="#1D2D44" />
            <polygon points="0,510 220,390 420,470 600,380 600,720 0,720" fill="#131B2E" />
            {/* Block-Sparse Attention Matrix Grid in Sky */}
            <g transform="translate(150, 95)" stroke="#23192D" strokeWidth="2">
              {[0, 1, 2, 3, 4].map((row) =>
                [0, 1, 2, 3, 4].map((col) => {
                  const isActive = col <= row && (row - col <= 1 || col === 0);
                  return (
                    <rect
                      key={`${row}-${col}`}
                      x={col * 46}
                      y={row * 46}
                      width="42"
                      height="42"
                      rx="6"
                      fill={isActive ? '#34D399' : '#1E293B'}
                      fillOpacity={isActive ? 0.72 : 0.25}
                    />
                  );
                })
              )}
            </g>
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F18] via-[#0D0F18]/45 to-transparent" />
        </div>
      );

    case 'clean_energy_grid':
    case 'reverse_engineering':
    default:
      return (
        <div
          className={`relative overflow-hidden select-none bg-[#1B263B] ${className}`}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 600 720"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full object-cover"
          >
            <defs>
              <linearGradient id="ce-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6D9DC5" />
                <stop offset="48%" stopColor="#F4A261" />
                <stop offset="82%" stopColor="#2A3D45" />
                <stop offset="100%" stopColor="#0F141C" />
              </linearGradient>
            </defs>
            <rect width="600" height="720" fill="url(#ce-sky)" />
            {/* Warm Golden Sun / Node */}
            <circle cx="430" cy="210" r="64" fill="#FFE5B4" fillOpacity="0.7" />
            {/* Terraced Hills & Architectural Towers */}
            <path d="M0,450 Q180,360 380,430 T600,390 L600,720 L0,720 Z" fill="#233142" />
            <g fill="#F4F1DE" fillOpacity="0.22" stroke="#FFE5B4" strokeOpacity="0.5" strokeWidth="1.5">
              <polygon points="150,430 190,320 230,430" />
              <polygon points="280,440 330,300 380,440" />
              <polygon points="420,420 465,310 510,420" />
            </g>
            {/* Glowing circuit / microgrid links */}
            <path
              d="M190,360 L330,340 L465,350"
              stroke="#34D399"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              fill="none"
            />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C1017] via-[#0C1017]/45 to-transparent" />
        </div>
      );
  }
};
