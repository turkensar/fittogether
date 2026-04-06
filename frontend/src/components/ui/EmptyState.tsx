'use client';

import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    Icon?: LucideIcon;
  };
}

export default function EmptyState({ Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-icon">
        <Icon size={24} className="text-primary-400" />
      </div>
      <h3 className="text-body font-bold mb-1">{title}</h3>
      {description && <p className="text-caption text-surface-400 mb-4">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-primary inline-flex items-center gap-2 px-6">
          {action.Icon && <action.Icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
