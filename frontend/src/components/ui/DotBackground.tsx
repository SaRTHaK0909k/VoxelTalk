import { cn } from '@/lib/utils'; // Assuming cn utility path

export function DotBackground() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      // Apply Tailwind classes for styling directly to the SVG
      className={cn(
        "pointer-events-none absolute inset-0 w-full h-full bg-black",
        // Fill color for the dots, inherited from the SVG element
        "fill-gray-400 dark:fill-gray-700",
        // Mask for the linear gradient effect
        "[mask-image:linear-gradient(to_bottom_right,black,black,black)]"
      )}
      aria-hidden="true"
      // Setting z-index here if you want it to be a specific layer
      // You'll control its overall z-index in the parent component's div for `DotBackground`
    >
      <defs>
        {/* Pattern definition for the repeating dots */}
        <pattern id="static-dot-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" /> {/* Circle will inherit fill color from parent SVG */}
        </pattern>

        {/* Linear gradient for the mask effect */}
        {/* x1/y1/x2/y2 define the direction of the gradient (top-left to bottom-right) */}
        <radialGradient id="static-gradient-mask" cx="50%" cy="50%" r="70%">
          {/* <stop offset="0%" stop-color="transparent" />   */}
          <stop offset="0%" stop-color="grey" />      {/* Start fully opaque */}
          <stop offset="90%" stop-color="grey" /> {/* Fade to transparent in the middle */}
          <stop offset="100%" stop-color="transparent" /> {/* Fully transparent at the end */}
        </radialGradient>

        

        {/* Mask definition, using the linear gradient */}
        <mask id="static-dots-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#static-gradient-mask)" />
        </mask>
      </defs>

      {/* Main rectangle that fills the SVG, applies the dot pattern, and then the gradient mask */}
      <rect x="0" y="0" width="100%" height="100%" fill="url(#static-dot-pattern)" mask="url(#static-dots-mask)" />
    </svg>
  );
}