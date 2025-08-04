import React from 'react';

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row flex-wrap gap-4 gap-y-2 w-full ${className}`}
    >
      {children}
    </div>
  );
}

interface FormContainerProps {
  children: React.ReactNode;
  visible?: boolean | string;
  className?: string;
  modal?: boolean;
}

export function FormContainer({
  children,
  visible,
  className = '',
  modal = false,
}: FormContainerProps) {
  // visible: true/false or 'visible'/'hidden' for modal transitions
  const isVisible = visible === true || visible === 'visible';
  return (
    <div
      className={`${modal ? 'z-[1000] absolute left-0 right-0 mx-auto' : 'relative'} ${
        isVisible
          ? 'transition-all duration-500 visible w-[min(75%,1000px)]'
          : 'transition-all duration-500 hidden w-[min(75%,1000px)]'
      } ${className}`}
      style={{ maxWidth: '1000px' }}
    >
      {children}
    </div>
  );
}

// Export FormContainerStyles as an alias for FormContainer for backward compatibility
export const FormContainerStyles = FormContainer;

// Export FormGroupStyles as an alias for FormGroup for backward compatibility
export const FormGroupStyles = FormGroup;

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  className?: string;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(function Form(
  { children, className = '', ...props },
  ref,
) {
  const isBorderless = className.includes('border-0');
  return (
    <form
      ref={ref}
      className={`flex flex-col gap-4 shadow-lg bg-base-200/20 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
      <style jsx>{`
        form {
          ${isBorderless
            ? 'border: 0;'
            : 'border: 5px solid hsl(var(--b3));'}
        }
        label {
          display: block;
          color: white;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        input:not([type='radio']):not([type='checkbox']):not([type='submit']),
        textarea,
        select {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          background-color: hsl(var(--b2));
          color: hsl(var(--bc));
          border: 2px solid hsl(var(--b3));
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }
        
        input:not([type='radio']):not([type='checkbox']):not([type='submit']):focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: #760D08;
          background-color: hsl(var(--b1));
          box-shadow: 0 0 0 3px rgba(118, 13, 8, 0.1);
        }
        
        input::placeholder,
        textarea::placeholder {
          color: hsl(var(--bc) / 0.6);
        }
        button,
        input[type='submit'] {
          width: auto;
          background: linear-gradient(135deg, #760D08, #38B6FF);
          color: white;
          border: 0;
          font-size: 2rem;
          font-weight: 600;
          padding: 0.8rem 1.2rem;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        button:hover,
        input[type='submit']:hover {
          filter: brightness(1.1);
        }
        
        input[type='radio'] {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid #760D08;
          border-radius: 50%;
          appearance: none;
          background-color: transparent;
          cursor: pointer;
          position: relative;
        }
        
        input[type='radio']:checked {
          background-color: #760D08;
          border-color: #760D08;
        }
        
        input[type='radio']:checked::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background-color: white;
          transform: translate(-50%, -50%);
        }
        
        input[type='checkbox'] {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid #760D08;
          border-radius: 0.25rem;
          appearance: none;
          background-color: transparent;
          cursor: pointer;
          position: relative;
        }
        
        input[type='checkbox']:checked {
          background-color: #760D08;
          border-color: #760D08;
        }
        
        input[type='checkbox']:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          color: white;
          font-size: 0.875rem;
          font-weight: bold;
          transform: translate(-50%, -50%);
        }
        
        textarea {
          height: 5rem;
          resize: none;
          overflow-y: hidden;
        }
        
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23760D08' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 0.75rem center;
          background-repeat: no-repeat;
          background-size: 1.25em 1.25em;
          padding-right: 2.75rem;
        }
        
        input[type='date']::-webkit-calendar-picker-indicator {
          filter: invert(0.2) sepia(1) saturate(5) hue-rotate(340deg);
        }
        fieldset {
          border: 0;
          padding: 0;
        }
        fieldset[disabled] {
          opacity: 0.5;
        }
        fieldset::before {
          height: 10px;
          content: '';
          display: block;
          background-image: linear-gradient(
            to right,
            #ff3019 0%,
            #e2b04a 50%,
            #ff3019 100%
          );
        }
        fieldset[aria-busy='true']::before {
          background-size: 50% auto;
          animation: loading 0.5s linear infinite;
        }
        @keyframes loading {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 100% 100%;
          }
        }
      `}</style>
    </form>
  );
});

export default Form;
