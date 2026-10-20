import React from 'react';
import { cn } from '../../lib/utils';

interface AssistantAvatarProps {
  avatar: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
}

export const AssistantAvatar: React.FC<AssistantAvatarProps> = ({
  avatar,
  color,
  size = 'md',
  online = true,
  className
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div 
        className={cn(
          'rounded-full flex items-center justify-center text-white font-bold shadow-sm',
          sizeClasses[size]
        )}
        style={{ backgroundColor: color }}
      >
        {avatar.length <= 2 ? avatar : <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />}
      </div>
      {online && (
        <span className={cn(
          'absolute bottom-0 right-0 block rounded-full ring-2 ring-white bg-green-400',
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-4 h-4'
        )} />
      )}
    </div>
  );
};
