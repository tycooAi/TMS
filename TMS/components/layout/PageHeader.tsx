import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, subtitle, badge, actions, children }: PageHeaderProps) {
  const desc = description || subtitle;
  const actionContent = actions || children;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-[#D9DBD6]">
      <div className="min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-[#16425B] tracking-tight break-words">{title}</h1>
          {badge}
        </div>
        {desc && <p className="text-xs text-[#5A6E7F] mt-1 break-words">{desc}</p>}
      </div>
      {actionContent && <div className="flex items-center gap-3 flex-wrap">{actionContent}</div>}
    </div>
  );
}
