import React from 'react';

interface DialogProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  variant?: 'inline' | 'modal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

interface DialogBackdropProps {
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function DialogBackdrop({
  onClick,
  className = '',
}: DialogBackdropProps) {
  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${className}`}
      onClick={onClick}
    />
  );
}

export function DialogHeader({
  children,
  onClose,
  showCloseButton = true,
  className = '',
}: DialogHeaderProps) {
  return (
    <div
      className={`flex justify-between items-center p-4 border-b border-[var(--blue)] ${className}`}
    >
      <h4 className="text-white text-xl font-semibold">{children}</h4>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 text-white bg-[var(--redTrans)] hover:bg-[var(--blue)] rounded-full flex items-center justify-center text-lg font-bold transition-colors duration-200"
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function DialogContent({
  children,
  className = '',
  maxHeight = 'max-h-[80vh]',
}: DialogContentProps) {
  return (
    <div className={`p-6 ${maxHeight} overflow-y-auto ${className}`}>
      {children}
    </div>
  );
}

export function Dialog({
  children,
  isOpen,
  onClose,
  title,
  variant = 'modal',
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
}: DialogProps) {
  if (!isOpen) return null;

  const sizeClass = sizeClasses[size];

  if (variant === 'inline') {
    return (
      <div
        className={`relative transition-all duration-500 visible w-[min(75%,1000px)] ${className}`}
        style={{ maxWidth: '1000px' }}
      >
        <div className="bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] border-[5px] border-[var(--tableAccentColor)] rounded-xl shadow-2xl p-6 relative w-full mx-auto">
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-40 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
              aria-label="Close"
            >
              ×
            </button>
          )}
          {children}
        </div>
      </div>
    );
  }

  // Modal variant
  return (
    <>
      <DialogBackdrop onClick={closeOnBackdropClick ? onClose : undefined} />
      <div
        className={`fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 ${sizeClass} h-auto rounded-3xl bg-gradient-to-tr from-[var(--red)] to-[var(--blue)] overflow-hidden border-2 border-[var(--blue)] shadow-2xl ${className}`}
      >
        {title && (
          <DialogHeader onClose={onClose} showCloseButton={showCloseButton}>
            {title}
          </DialogHeader>
        )}
        {children}
      </div>
    </>
  );
}

// Convenience components for common patterns
export function FormDialog({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnBackdropClick = true,
}: Omit<DialogProps, 'variant'>) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="modal"
      size={size}
      className={className}
      showCloseButton={showCloseButton}
      closeOnBackdropClick={closeOnBackdropClick}
    >
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}

export function InlineFormDialog({
  children,
  isOpen,
  onClose,
  className = '',
  showCloseButton = true,
}: Omit<DialogProps, 'variant' | 'title' | 'size'>) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      variant="inline"
      className={className}
      showCloseButton={showCloseButton}
    >
      {children}
    </Dialog>
  );
}
