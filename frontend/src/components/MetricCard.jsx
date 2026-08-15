import React from 'react';

const MetricCard = ({ label, value, subtitle, accentColor = 'indigo' }) => {
  const colorMap = {
    indigo: 'text-indigo-400 border-indigo-900/40 bg-indigo-950/20',
    emerald: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20',
    amber: 'text-amber-400 border-amber-900/40 bg-amber-950/20',
    purple: 'text-purple-400 border-purple-900/40 bg-purple-950/20',
    blue: 'text-blue-400 border-blue-900/40 bg-blue-950/20',
  };

  const selectedTheme = colorMap[accentColor] || colorMap.indigo;

  return (
    <div className={`border rounded-2xl p-5 shadow-sm backdrop-blur-sm ${selectedTheme}`}>
      <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
      {subtitle && <p className="text-[11px] text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
};

export default MetricCard;
