export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading">
        <div className="block">
          <div className="item" />
          <div className="item" />
          <div className="item" />
          <div className="item" />
          <div className="item" />
          <div className="item" />
          <div className="item" />
          <div className="item" />
        </div>
      </div>
      <style jsx>{`
        .loading-container {
          --duration: 2s;
          --size: 2rem;
        }

        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          height: calc(2 * var(--size));
          width: calc(2 * var(--size));
          transform: translateX(-50%) translateY(-50%);
        }

        .block {
          position: relative;
          padding: 20rem;
          height: var(--size);
          width: var(--size);
        }

        .item {
          position: absolute;
          height: var(--size);
          width: var(--size);
          background: linear-gradient(to top right, var(--red), var(--blue));
          animation: move var(--duration) linear infinite;
        }

        .item:nth-of-type(1) {
          top: calc(-1 * var(--size));
          left: calc(-1 * var(--size));
          animation-delay: calc(-7 * var(--duration) / 8);
        }

        .item:nth-of-type(2) {
          top: calc(-1 * var(--size));
          left: 0;
          animation-delay: calc(-6 * var(--duration) / 8);
        }

        .item:nth-of-type(3) {
          top: calc(-1 * var(--size));
          left: var(--size);
          animation-delay: calc(-5 * var(--duration) / 8);
        }

        .item:nth-of-type(4) {
          top: 0;
          left: var(--size);
          animation-delay: calc(-4 * var(--duration) / 8);
        }

        .item:nth-of-type(5) {
          top: var(--size);
          left: var(--size);
          animation-delay: calc(-3 * var(--duration) / 8);
        }

        .item:nth-of-type(6) {
          top: var(--size);
          left: 0;
          animation-delay: calc(-2 * var(--duration) / 8);
        }

        .item:nth-of-type(7) {
          top: var(--size);
          left: calc(-1 * var(--size));
          animation-delay: calc(-1 * var(--duration) / 8);
        }

        .item:nth-of-type(8) {
          top: 0;
          left: calc(-1 * var(--size));
          animation-delay: calc(0 * var(--duration) / 8);
        }

        @keyframes move {
          0% {
            transform: rotate(0) scale(1);
            animation-timing-function: ease-in;
          }
          10% {
            transform: rotate(90deg) scale(0);
          }
          50% {
            transform: rotate(90deg) scale(0);
            animation-timing-function: ease-out;
          }
          60% {
            transform: rotate(180deg) scale(1);
          }
          100% {
            transform: rotate(180deg) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
