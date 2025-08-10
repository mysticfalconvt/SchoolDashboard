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
  maxHeight?: string;
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
      className={`fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm ${className}`}
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
      className={`flex justify-between items-center px-4 py-2 border-b flex-shrink-0 ${className}`}
      style={{ borderBottomColor: '#38B6FF' }}
    >
      <h4 className="text-white text-xl font-semibold flex-shrink-0">
        {children}
      </h4>
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 border-none w-10 h-10 text-white hover:brightness-110 ml-4 flex-shrink-0"
          style={{ background: 'rgba(118, 13, 8, 0.8)' }}
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
  maxHeight = 'max-h-[70vh]',
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
  maxHeight,
}: DialogProps) {
  if (!isOpen) return null;

  const sizeClass = sizeClasses[size];

  if (variant === 'inline') {
    return (
      <div
        className={`relative transition-all duration-500 visible w-[min(75%,1000px)] ${className}`}
        style={{ maxWidth: '1000px' }}
      >
        <div
          className="modal-box border-[5px] border-base-300 rounded-xl shadow-2xl p-6 relative w-full mx-auto max-w-5xl"
          style={{
            background: 'linear-gradient(to top left, #760D08, #38B6FF)',
          }}
        >
          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 text-white text-2xl font-bold bg-black/40 hover:bg-black/70 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none border-none transition-all duration-200"
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
        className={`modal modal-open fixed z-50 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 ${sizeClass} rounded-3xl overflow-hidden border-2 shadow-2xl ${className}`}
        style={{
          background: 'linear-gradient(to top right, #760D08, #38B6FF)',
          borderColor: '#38B6FF',
          maxHeight: maxHeight || '90vh',
          height: 'fit-content',
        }}
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
      <DialogContent className="pt-2 px-8">{children}</DialogContent>
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
