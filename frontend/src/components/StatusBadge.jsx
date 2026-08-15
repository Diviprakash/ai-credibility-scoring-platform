import React from 'react';

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    classes: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400',
  },
  PUBLISHED: {
    label: 'Published',
    classes: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    dot: 'bg-amber-400',
  },
  OPEN: {
    label: 'Voting Open',
    classes: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    dot: 'bg-emerald-400 animate-ping',
  },
  CLOSED: {
    label: 'Voting Closed',
    classes: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    dot: 'bg-blue-400',
  },
  RESULT_PUBLISHED: {
    label: 'Results Published',
    classes: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
    dot: 'bg-purple-400',
  },
};

const StatusBadge = ({ status, className = '' }) => {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    classes: 'bg-slate-800 text-slate-400 border-slate-700',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${config.classes} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
