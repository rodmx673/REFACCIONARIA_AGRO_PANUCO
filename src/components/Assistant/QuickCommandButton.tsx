import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickCommandButtonProps {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  className?: string;
  color?: string;
}

export const QuickCommandButton: React.FC<QuickCommandButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  className,
  color = '#3b82f6'
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border hover:shadow-sm',
        className
      )}
      style={{ 
        borderColor: `${color}40`, 
        backgroundColor: `${color}10`,
        color: color
      }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </button>
  );
};
