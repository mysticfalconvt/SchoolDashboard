import React from "react";

// Universal Gradient Button
const GradientButton = React.forwardRef(function GradientButton(
  { className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] text-[var(--navTextColor)] font-medium border border-[var(--backgroundColor)] rounded-xl uppercase text-lg px-6 py-3 skew-x-[-2deg] inline-block transition-all duration-500 m-1 max-h-full outline-none disabled:opacity-50 hover:border-[var(--red)] hover:brightness-110 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

// Smaller Gradient Button
export const SmallGradientButton = React.forwardRef(function SmallGradientButton(
  { className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] text-[var(--navTextColor)] font-medium border border-[var(--backgroundColor)] rounded-xl uppercase text-sm px-4 py-2 skew-x-[-3deg] inline-block transition-all duration-500 outline-none disabled:opacity-50 hover:border-[var(--red)] hover:brightness-110 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

// Left Edge Button (vertical, for edge placement)
export const LeftEdgeButton = React.forwardRef(function LeftEdgeButton(
  { className = "", children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`bg-gradient-to-tl from-[var(--red)] to-[var(--blue)] px-4 py-2 absolute left-2 rounded-xl opacity-90 text-lg text-[var(--navTextColor)] max-w-min outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default GradientButton;
