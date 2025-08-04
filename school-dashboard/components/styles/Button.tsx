import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children?: React.ReactNode;
}

// Universal Gradient Button with exact brand colors
const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function GradientButton({ className = '', children, style, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`text-white font-medium border border-white/20 rounded-xl uppercase text-lg px-6 py-3 skew-x-[-2deg] inline-block transition-all duration-500 m-1 max-h-full outline-none disabled:opacity-50 hover:brightness-110 break-words whitespace-normal shadow-lg hover:shadow-xl flex items-center justify-center ${className}`}
        style={{ 
          ...style,
          background: 'linear-gradient(to top left, #760D08, #38B6FF)'
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

// Smaller Gradient Button with exact brand colors
export const SmallGradientButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function SmallGradientButton({ className = '', children, style, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`text-white font-medium border border-white/20 rounded-xl uppercase text-sm px-4 py-2 skew-x-[-3deg] inline-block transition-all duration-500 outline-none disabled:opacity-50 hover:brightness-110 break-words whitespace-normal shadow-md hover:shadow-lg flex items-center justify-center ${className}`}
      style={{ 
        ...style,
        background: 'linear-gradient(to top left, #760D08, #38B6FF)'
      }}
      {...props}
    >
      {children}
    </button>
  );
});

// Left Edge Button (vertical, for edge placement) with exact brand colors
export const LeftEdgeButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function LeftEdgeButton({ className = '', children, style, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`border-none px-4 py-2 absolute left-2 rounded-xl opacity-90 text-lg text-white max-w-min outline-none shadow-lg hover:opacity-100 hover:brightness-110 transition-all duration-300 flex items-center justify-center ${className}`}
        style={{ 
          ...style,
          background: 'linear-gradient(to top left, #760D08, #38B6FF)'
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

export default GradientButton;
