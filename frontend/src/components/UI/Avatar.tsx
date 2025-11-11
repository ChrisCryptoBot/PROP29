import React from 'react';
import { cn } from '../../utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };

