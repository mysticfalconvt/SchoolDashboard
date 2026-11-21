import type { InputHTMLAttributes } from 'react';

// On/off switch. Replaces react-toggle, which does not support React 19.
//
// It renders a real checkbox stretched over the track, so clicks, keyboard,
// form names and `onChange(event)` handlers that read `event.target.checked`
// all behave like a plain checkbox. Pass role="switch" for screen readers
// where that reads better.
type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /**
   * Track colours, as Tailwind classes. Use `peer-checked:` for the on state,
   * e.g. "bg-red-800 peer-checked:bg-sky-400".
   */
  trackClassName?: string;
};

export default function Toggle({
  className = '',
  trackClassName = 'bg-[#4d4d4d] peer-checked:bg-[#19ab27]',
  ...inputProps
}: ToggleProps) {
  return (
    <span
      className={`relative inline-flex h-6 w-[50px] shrink-0 align-middle ${className}`}
    >
      <input
        type="checkbox"
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...inputProps}
      />
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400 peer-focus-visible:ring-offset-1 peer-disabled:opacity-50 ${trackClassName}`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-px top-px h-[22px] w-[22px] rounded-full border border-[#4d4d4d] bg-[#fafafa] shadow-sm transition-transform duration-200 peer-checked:translate-x-[26px] peer-checked:border-transparent"
      />
    </span>
  );
}
