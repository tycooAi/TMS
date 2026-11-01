import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  note?: string;
  trend?: {
    text: string;
    positive?: boolean;
  };
  onClick?: () => void;
}

export function KpiCard({ label, value, note, trend, onClick }: KpiCardProps) {
  return (
    <article
      onClick={onClick}
      className={`p-5 bg-white rounded-lg border border-[#D9DBD6] transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-[#2F668F] hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#5A6E7F] uppercase tracking-wider">
          {label}
        </p>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.positive ? 'text-[#207a4c]' : 'text-[#b45309]'
            }`}
          >
            {trend.text}
          </span>
        )}
      </div>
      <strong className="block my-2 text-2xl font-bold text-[#16425B] tabular-nums tracking-tight">
        {value}
      </strong>
      {note && <span className="text-xs text-[#3B7CA6] font-medium">{note}</span>}
    </article>
  );
}
