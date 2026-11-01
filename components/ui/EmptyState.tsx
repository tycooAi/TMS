import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-lg border border-[#D9DBD6]">
      {icon && <div className="mb-3 text-[#5A6E7F]">{icon}</div>}
      <h3 className="text-sm font-semibold text-[#16425B]">{title}</h3>
      <p className="mt-1 text-xs text-[#5A6E7F] max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
