import { useState } from "react";
import { X } from "lucide-react";
import { MapMarker } from "../data/mockData";

interface MapViewProps {
  markers: MapMarker[];
  className?: string;
  height?: string;
}

const MARKER_CONFIG = {
  victim:    { color: "#dc2626", bg: "bg-red-100",    border: "border-red-400",   label: "Victims",    icon: "●" },
  volunteer: { color: "#1e3a5f", bg: "bg-blue-100",   border: "border-blue-400",  label: "Volunteers", icon: "●" },
  shelter:   { color: "#16a34a", bg: "bg-green-100",  border: "border-green-400", label: "Shelters",   icon: "■" },
  medical:   { color: "#7c3aed", bg: "bg-purple-100", border: "border-purple-400",label: "Medical",    icon: "+" },
  relief:    { color: "#f97316", bg: "bg-orange-100", border: "border-orange-400",label: "Relief",     icon: "◆" },
};

// Bangladesh bounding box: lat 20.6–26.6, lng 88.0–92.7
const toX = (lng: number) => Math.max(2, Math.min(98, ((lng - 88.0) / 4.7) * 100));
const toY = (lat: number) => Math.max(2, Math.min(98, (1 - (lat - 20.6) / 6.0) * 100));

export default function MapView({ markers, className = "", height = "h-80" }: MapViewProps) {
  const [active, setActive] = useState<MapMarker | null>(null);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 ${height} ${className}`} style={{ background: "#dce8f0" }}>
      {/* SVG map base */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Bay of Bengal */}
        <path d="M 0,82 Q 20,78 45,84 Q 65,88 100,86 L 100,100 L 0,100 Z" fill="#7ec8e3" opacity="0.7" />
        {/* Land mass */}
        <path d="M 5,5 Q 30,2 55,5 Q 80,8 95,5 L 98,82 Q 65,85 45,80 Q 20,75 2,82 Z" fill="#d4e8c8" opacity="0.8" />
        {/* Jamuna/Brahmaputra river */}
        <path d="M 42,2 Q 40,15 38,28 Q 36,42 38,55 Q 40,65 44,75" stroke="#7ec8e3" strokeWidth="1.8" fill="none" opacity="0.9" />
        {/* Padma river */}
        <path d="M 5,42 Q 18,44 28,48 Q 40,52 52,58 Q 64,64 74,70 Q 82,74 90,76" stroke="#7ec8e3" strokeWidth="1.8" fill="none" opacity="0.9" />
        {/* Meghna river */}
        <path d="M 60,28 Q 63,38 65,48 Q 67,58 68,68 Q 69,74 72,80" stroke="#7ec8e3" strokeWidth="1.4" fill="none" opacity="0.8" />
        {/* Surma river (northeast) */}
        <path d="M 62,12 Q 68,18 72,26 Q 76,33 72,40" stroke="#7ec8e3" strokeWidth="1.0" fill="none" opacity="0.7" />
        {/* Karnaphuli (south) */}
        <path d="M 80,60 Q 84,66 86,72 Q 88,76 90,80" stroke="#7ec8e3" strokeWidth="1.0" fill="none" opacity="0.7" />
        {/* Grid lines */}
        {[20, 40, 60, 80].map(v => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="100" stroke="#1e3a5f" strokeWidth="0.15" opacity="0.2" strokeDasharray="2,3" />
            <line x1="0" y1={v} x2="100" y2={v} stroke="#1e3a5f" strokeWidth="0.15" opacity="0.2" strokeDasharray="2,3" />
          </g>
        ))}
        {/* City dots */}
        <circle cx={toX(90.4125)} cy={toY(23.8103)} r="1.2" fill="#1e3a5f" opacity="0.6" />
        <circle cx={toX(91.8687)} cy={toY(24.8949)} r="1.0" fill="#1e3a5f" opacity="0.6" />
        <circle cx={toX(91.8388)} cy={toY(22.3384)} r="0.9" fill="#1e3a5f" opacity="0.6" />
        <circle cx={toX(89.3500)} cy={toY(24.3745)} r="0.8" fill="#1e3a5f" opacity="0.5" />
      </svg>

      {/* City labels */}
      <div className="absolute" style={{ left: `${toX(90.4125) - 0.5}%`, top: `${toY(23.8103) + 2}%`, transform: "translateX(-50%)" }}>
        <span className="text-[8px] font-semibold text-[#1e3a5f] opacity-70 whitespace-nowrap">Dhaka</span>
      </div>
      <div className="absolute" style={{ left: `${toX(91.8687)}%`, top: `${toY(24.8949) + 2}%`, transform: "translateX(-50%)" }}>
        <span className="text-[8px] font-semibold text-[#1e3a5f] opacity-70 whitespace-nowrap">Sylhet</span>
      </div>
      <div className="absolute" style={{ left: `${toX(91.8388) + 2}%`, top: `${toY(22.3384)}%`, transform: "translateX(-50%)" }}>
        <span className="text-[8px] font-semibold text-[#1e3a5f] opacity-70 whitespace-nowrap">Ctg</span>
      </div>

      {/* Markers */}
      {markers.map(marker => {
        const x = toX(marker.location.lng);
        const y = toY(marker.location.lat);
        const cfg = MARKER_CONFIG[marker.type];
        const isActive = active?.id === marker.id;
        return (
          <div
            key={marker.id}
            className="absolute cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", zIndex: isActive ? 20 : 10 }}
            onClick={() => setActive(isActive ? null : marker)}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125"
              style={{ background: cfg.color }}
              title={marker.label}
            />
            {isActive && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-3 min-w-44 border border-gray-100 z-30">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-[#0f1b2d] leading-tight">{marker.label}</span>
                  <button onClick={(e) => { e.stopPropagation(); setActive(null); }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] text-[#5a7190] block">{marker.location.label}</span>
                <span className="text-[10px] text-[#0f1b2d] mt-1 block">{marker.detail}</span>
                {marker.status && (
                  <span
                    className="inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: cfg.color + "22", color: cfg.color }}
                  >
                    {marker.status}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Overlay click to close */}
      {active && (
        <div className="absolute inset-0 z-0" onClick={() => setActive(null)} />
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-1">
          {Object.entries(MARKER_CONFIG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm" style={{ background: cfg.color }} />
              <span className="text-[9px] font-medium text-[#5a7190]">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Zoom controls (decorative) */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button className="w-7 h-7 bg-white/90 rounded-lg shadow-sm border border-gray-100 text-[#1e3a5f] font-bold text-sm flex items-center justify-center hover:bg-white transition-colors">+</button>
        <button className="w-7 h-7 bg-white/90 rounded-lg shadow-sm border border-gray-100 text-[#1e3a5f] font-bold text-sm flex items-center justify-center hover:bg-white transition-colors">−</button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 right-3 bg-white/80 rounded-lg px-2 py-1 text-[9px] text-[#5a7190] border border-gray-100">
        Bangladesh · RescueNet
      </div>
    </div>
  );
}
