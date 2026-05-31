import React from 'react';

export default function MinimalWritingAnimation() {
  return (
    <>
      {/* Import the clean handwriting script font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500&display=swap');
      `}</style>

      <svg
        viewBox="0 0 550 120"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-teal-400 max-w-[550px]"
      >
        <style>{`
          /* Pure text typography setup */
          .handwritten-text {
            font-family: 'Caveat', cursive;
            font-size: 56px;
            fill: currentColor;
            letter-spacing: 2px;
          }

          /* The hidden tracing mask that pulls away to reveal the word */
          .reveal-stroke {
            stroke: #000000; /* Set this exactly to your page's background color (e.g. #0f172a) */
            stroke-width: 14;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 1000;
            stroke-dashoffset: 0;
            animation: pull-mask 3.5s cubic-bezier(0.45, 0, 0.55, 1) forwards;
          }

          @keyframes pull-mask {
            from { stroke-dashoffset: 0; }
            to   { stroke-dashoffset: 1000; }
          }

          @media (prefers-reduced-motion: reduce) {
            .reveal-stroke {
              display: none !important;
            }
          }
        `}</style>

        {/* Mask configuration structure */}
        <mask id="writing-mask">
          {/* Base canvas layer visibility */}
          <rect width="100%" height="100%" fill="white" />
          {/* The inverse path tracking the baseline of the letters */}
          <path 
            className="reveal-stroke" 
            d="M 45 75 L 100 45 L 135 75 L 180 75 L 225 75 M 275 40 L 325 75 L 385 75 L 435 50 L 500 75" 
          />
        </mask>

        {/* Bound layout output target */}
        <g mask="url(#writing-mask)">
          <text x="40" y="75" className="handwritten-text">
            Aayush Koirala
          </text>
        </g>
      </svg>
    </>
  );
}