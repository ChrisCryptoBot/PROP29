import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  className?: string;
  /** When true (default), modal is draggable via title bar. Matches Global Clock / UI gold standard. */
  draggable?: boolean;
}

const sizeClasses = {
  sm: 'w-full max-w-md',
  md: 'w-full max-w-2xl',
  lg: 'w-full max-w-4xl',
  xl: 'w-full max-w-6xl',
} as const;

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  className,
  draggable = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setPosition(null);
      setIsDragging(false);
      setTimeout(() => modalRef.current?.focus(), 0);
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        if (previousFocusRef.current) previousFocusRef.current.focus();
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const el = modalRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const nextX = e.clientX - dragOffsetRef.current.x;
      const nextY = e.clientY - dragOffsetRef.current.y;
      const x = Math.max(0, Math.min(window.innerWidth - w, nextX));
      const y = Math.max(0, Math.min(window.innerHeight - h, nextY));
      setPosition({ x, y });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!draggable) return;
      e.preventDefault();
      const el = modalRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = position === null ? rect.left : position.x;
      const py = position === null ? rect.top : position.y;
      dragOffsetRef.current = { x: e.clientX - px, y: e.clientY - py };
      if (position === null) setPosition({ x: rect.left, y: rect.top });
      setIsDragging(true);
    },
    [draggable, position]
  );

  if (!isOpen) return null;

  const style: React.CSSProperties =
    position === null
      ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
      : { left: position.x, top: position.y };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'absolute bg-slate-900/70 rounded-lg p-6 border border-white/5 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto',
          sizeClasses[size],
          className
        )}
        style={style}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {draggable ? (
          <div
            className={cn(
              'cursor-default hover:cursor-move select-none -mx-6 -mt-6 px-6 pt-6 pb-2 mb-6 border-b border-white/5',
              title ? 'flex items-center' : 'min-h-[2rem]'
            )}
            onMouseDown={handleDragStart}
          >
            {title && (
              <h3 id="modal-title" className="text-xl font-black uppercase tracking-tighter text-white">
                {title}
              </h3>
            )}
            {!title && <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Drag to move</span>}
          </div>
        ) : title ? (
          <h3 id="modal-title" className="text-xl font-black uppercase tracking-tighter text-white mb-6">
            {title}
          </h3>
        ) : null}
        {children}
        {footer && (
          <div className="flex justify-end space-x-3 mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export { Modal };
