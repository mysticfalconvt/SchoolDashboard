import React from "react";

export function FormGroup({ children, className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row flex-wrap gap-4 gap-y-2 w-full ${className}`}>
      {children}
    </div>
  );
}

export function FormContainer({ children, visible, className = "" }) {
  // visible: true/false or 'visible'/'hidden' for modal transitions
  const isVisible = visible === true || visible === "visible";
  return (
    <div
      className={`z-[1000] absolute left-0 right-0 mx-auto ${isVisible
        ? "transition-all duration-500 visible w-[min(75%,1000px)]"
        : "transition-all duration-500 hidden w-[min(75%,1000px)]"
        } ${className}`}
      style={{ maxWidth: "1000px" }}
    >
      {children}
    </div>
  );
}

const Form = React.forwardRef(function Form(
  { children, className = "", ...props },
  ref
) {
  const isBorderless = className.includes("border-0");
  return (
    <form
      ref={ref}
      className={`flex flex-col gap-4 shadow-[0_0_5px_3px_rgba(0,0,0,0.05)] bg-[rgba(0,0,0,0.02)] ${className}`}
      {...props}
    >
      {children}
      <style jsx>{`
        form {
          ${isBorderless ? "border: 0;" : "border: 5px solid var(--tableAccentColor);"}
        }
        label {
          display: block;
          color: white;
          margin-bottom: 1rem;
        }
        input,
        textarea,
        select {
          width: 100%;
          padding: 0.5rem;
          font-size: 1rem;
          background-color: var(--backgroundColor);
          color: var(--textColor);
          border: 1px solid black;
        }
        input:focus,
        textarea:focus,
        select:focus {
          outline: 0;
          border-color: var(--red);
        }
        button,
        input[type="submit"] {
          width: auto;
          background: radial-gradient(var(--blue), var(--red));
          color: white;
          border: 0;
          font-size: 2rem;
          font-weight: 600;
          padding: 0.8rem 1.2rem;
          border-radius: 1rem;
        }
        input[type="radio"] {
          display: inline-block;
          width: 20px;
        }
        textarea {
          height: 5rem;
          resize: none;
          overflow-y: hidden;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(50%);
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
          content: "";
          display: block;
          background-image: linear-gradient(
            to right,
            #ff3019 0%,
            #e2b04a 50%,
            #ff3019 100%
          );
        }
        fieldset[aria-busy="true"]::before {
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
