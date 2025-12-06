/*
 ! Add the following to your .globals.css

       
*/
"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react"
//import { type StaticImageData } from "next/image"
import cult from "@/assets/react.svg"
import clsx from "clsx"
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionTemplate,
  useMotionValue,
  type MotionStyle,
  type MotionValue,
  type Variants,
} from "motion/react"
import Balancer from "react-wrap-balancer"

import { cn } from "@/lib/utils"

type ViteStaticImageData = string | { src: string; height: number; width: number; blurDataURL?: string; };

// Types
type WrapperStyle = MotionStyle & {
  "--x": MotionValue<string>
  "--y": MotionValue<string>
}

interface CardProps {
  title: string
  description: string
  bgClass?: string
}

interface ImageSet {
  step1dark1?: ViteStaticImageData
//   step1dark2?: ViteStaticImageData
  step1light1: ViteStaticImageData
//   step1light2: ViteStaticImageData
  step2dark1?: ViteStaticImageData
//   step2dark2?: ViteStaticImageData
  step2light1: ViteStaticImageData
//   step2light2: ViteStaticImageData
//   step3dark?: ViteStaticImageData
  step3light: ViteStaticImageData
//   step4light: ViteStaticImageData
  alt: string
}

interface FeatureCarouselProps extends CardProps {
  step1img1Class?: string
//   step1img2Class?: string
  step2img1Class?: string
//   step2img2Class?: string
  step3imgClass?: string
//   step4imgClass?: string
  image: ImageSet
}

interface StepImageProps {
  src: ViteStaticImageData
  alt: string
  className?: string
  style?: React.CSSProperties
  width?: number
  height?: number
}

interface Step {
  id: string
  name: string
  title: string
  description: string
}

// Constants
const TOTAL_STEPS = 3

const steps = [
  {
    id: "1",
    name: "Step 1",
    title: "Step 1: Scribble the Riddle ✏️",
    description: "Whip out your inner Einstein—just draw that tricky math expression or physics puzzle right on the canvas. No formulas left behind!",
  },
  {
    id: "2",
    name: "Step 2",
    title: "Step 2: Tap for Brains 🧠",
    description: "Hit the \"Solve\" button and let VoxelTalk do the thinking. We crunch the numbers, you chill.",
  },
  {
    id: "3",
    name: "Step 3",
    title: "Step 3: Latex It Easy ✨",
    description: "Voilà! Your answer arrives as a slick, draggable LaTeX expression—perfectly formatted and ready to show off.",
  },
] as const

/**
 * Animation presets for reusable motion configurations.
 * Each preset defines the initial, animate, and exit states,
 * along with spring physics parameters for smooth transitions.
 */
const ANIMATION_PRESETS = {
  fadeInScale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: {
      type: "spring",
      stiffness: 300, // Higher value = more rigid spring
      damping: 25, // Higher value = less oscillation
      mass: 0.5, // Lower value = faster movement
    },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      mass: 0.5,
    },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      mass: 0.5,
    },
  },
} as const

type AnimationPreset = keyof typeof ANIMATION_PRESETS

interface AnimatedStepImageProps extends StepImageProps {
  preset?: AnimationPreset
  delay?: number
  onAnimationComplete?: () => void
}

/**
 * Custom hook for managing cyclic transitions with auto-play functionality.
 * Handles both automatic cycling and manual transitions between steps.
 */
function useNumberCycler(
  totalSteps: number = TOTAL_STEPS,
  interval: number = 3500
) {
  const [currentNumber, setCurrentNumber] = useState(0)
  const [isManualInteraction, setIsManualInteraction] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Setup timer function
  const setupTimer = useCallback(() => {
    console.log("Setting up timer")
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      console.log("Timer triggered, advancing to next step")
      setCurrentNumber((prev) => (prev + 1) % totalSteps)
      setIsManualInteraction(false)
      // Recursively setup next timer
      setupTimer()
    }, interval)
  }, [interval, totalSteps])

  // Handle manual increment
  const increment = useCallback(() => {
    console.log("Manual increment triggered")
    setIsManualInteraction(true)
    setCurrentNumber((prev) => (prev + 1) % totalSteps)

    // Reset timer on manual interaction
    setupTimer()
  }, [totalSteps, setupTimer])

  // Initial timer setup and cleanup
  useEffect(() => {
    console.log("Initial timer setup")
    setupTimer()

    return () => {
      console.log("Cleaning up timer")
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [setupTimer])

  // Debug logging
  useEffect(() => {
    console.log("Current state:", {
      currentNumber,
      isManualInteraction,
      hasTimer: !!timerRef.current,
    })
  }, [currentNumber, isManualInteraction])

  return {
    currentNumber,
    increment,
    isManualInteraction,
  }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const userAgent = navigator.userAgent
    const isSmall = window.matchMedia("(max-width: 768px)").matches
    const isMobile = Boolean(
      /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.exec(
        userAgent
      )
    )

    const isDev = process.env.NODE_ENV !== "production"
    if (isDev) setIsMobile(isSmall || isMobile)

    setIsMobile(isSmall && isMobile)
  }, [])

  return isMobile
}

// Components
function IconCheck({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
      {...props}
    >
      <path d="m229.66 77.66-128 128a8 8 0 0 1-11.32 0l-56-56a8 8 0 0 1 11.32-11.32L96 188.69 218.34 66.34a8 8 0 0 1 11.32 11.32Z" />
    </svg>
  )
}

const stepVariants: Variants = {
  inactive: {
    scale: 0.8,
    opacity: 0.5,
  },
  active: {
    scale: 1,
    opacity: 1,
  },
}

const StepImage = forwardRef<
  HTMLImageElement,
  StepImageProps & { [key: string]: any }
>(
  (
    { src, alt, className, style, width = 600, height = 315, ...props },
    ref
  ) => {
    const imageSrc = typeof src === 'string' ? src : src.src;

    return (
      <img
        ref={ref}
        alt={alt}
        className={className}
        src={imageSrc} // Use imageSrc here
        style={{
          position: "absolute",
          userSelect: "none",
          maxWidth: "unset",
          ...style,
        }}
        {...(width && { width })} // Conditionally apply width if provided
        {...(height && { height })} // Conditionally apply height if provided
        {...props}
      />
    )
  }
)
StepImage.displayName = "StepImage"

const MotionStepImage = motion(StepImage)

/**
 * Wrapper component for StepImage that applies animation presets.
 * Simplifies the application of complex animations through preset configurations.
 */
const AnimatedStepImage = ({
  preset = "fadeInScale",
  delay = 0,
  onAnimationComplete,
  ...props
}: AnimatedStepImageProps) => {
  const presetConfig = ANIMATION_PRESETS[preset]
  return (
    <MotionStepImage
      {...props}
      {...presetConfig}
      transition={{
        ...presetConfig.transition,
        delay,
      }}
      onAnimationComplete={onAnimationComplete}
    />
  )
}

/**
 * Main card component that handles mouse tracking for gradient effect.
 * Uses motion values to create an interactive gradient that follows the cursor.
 */
function FeatureCard({
  bgClass,
  children,
  step,
}: CardProps & {
  children: React.ReactNode
  step: number
}) {
  const [mounted, setMounted] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const isMobile = useIsMobile()

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    if (isMobile) return
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <motion.div className="relative w-full md:px-28 pointer-events-none ">
        <motion.div
      className="bg-zinc-900/40 animated-cards relative w-full mt-64 mb-20 p-0.5 overflow-hidden rounded-[32px] border-8 border-zinc-800 pointer-events-auto"
      onMouseMove={handleMouseMove}
      style={
        {
          "--x": useMotionTemplate`${mouseX}px`,
          "--y": useMotionTemplate`${mouseY}px`,
        } as WrapperStyle
      }
    >
      <div
        className={clsx(
          "group relative w-full overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-b from-neutral-900/90 to-stone-800 transition duration-300 dark:from-neutral-950/90 dark:to-neutral-800/90",
          "md:hover:border-transparent",
          bgClass
        )}
      >
        <div className="m-10 min-h-[550px] w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className="flex w-4/6 flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              <motion.h2
                className="text-xl mt-4 font-bold tracking-tight text-white md:text-2xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.1,
                  duration: 0.3,
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                {steps[step].title}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.3,
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                <p className="text-sm leading-5 text-neutral-300 sm:text-base sm:leading-5 dark:text-zinc-400">
                  <Balancer>{steps[step].description}</Balancer>
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
          {mounted ? children : null}
        </div>
      </div>
    </motion.div>
    </motion.div>
  )
}

/**
 * Progress indicator component that shows current step and completion status.
 * Handles complex state transitions and animations for step indicators.
 */
function Steps({
  steps,
  current,
  onChange,
}: {
  steps: readonly Step[]
  current: number
  onChange: (index: number) => void
}) {
  return (
    <nav aria-label="Progress" className="flex justify-center px-4">
      <ol
        className="z-0 flex w-full flex-wrap items-start justify-start gap-2 sm:justify-center md:w-10/12 md:divide-y-0"
        role="list"
      >
        {steps.map((step, stepIdx) => {
          // Calculate step states for styling and animations
          const isCompleted = current > stepIdx
          const isCurrent = current === stepIdx
          const isFuture = !isCompleted && !isCurrent

          return (
            <motion.li
              key={`${step.name}-${stepIdx}`}
              initial="inactive"
              animate={isCurrent ? "active" : "inactive"}
              variants={stepVariants}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative z-0 rounded-full px-3 py-1 transition-all duration-300 ease-in-out md:flex",
                isCompleted ? "bg-neutral-500/20" : "bg-neutral-500/10"
              )}
            >
              <div
                className={cn(
                  "relative z-0 group flex w-full cursor-pointer items-center focus:outline-none focus-visible:ring-2",
                  (isFuture || isCurrent) && "pointer-events-none"
                )}
                onClick={() => onChange(stepIdx)}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <motion.span
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.2 : 1,
                    }}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full duration-300",
                      isCompleted &&
                        "bg-brand-400 text-white dark:bg-brand-400",
                      isCurrent &&
                        "bg-brand-300/80 text-neutral-400 dark:bg-neutral-500/50",
                      isFuture && "bg-brand-300/10 dark:bg-neutral-500/20"
                    )}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                      >
                        <IconCheck className="h-3 w-3 stroke-white stroke-[3] text-white dark:stroke-black" />
                      </motion.div>
                    ) : (
                      <span
                        className={cn(
                          "text-xs",
                          !isCurrent && "text-[#00539B]"
                        )}
                      >
                        {stepIdx + 1}
                      </span>
                    )}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={clsx(
                      "text-sm font-medium duration-300",
                      isCompleted && "text-muted-foreground",
                      isCurrent && "text-[#00539B]",
                      isFuture && "text-neutral-500"
                    )}
                  >
                    {step.name}
                  </motion.span>
                </span>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </nav>
  )
}

const defaultClasses = {
  step1img1:
    "pointer-events-none w-full border border-zinc-800 transition-all duration-500 dark:border-zinc-800/50 rounded-2xl",
//   step1img2:
//     "pointer-events-none w-[60%] border border-border-100/10 dark:border-border-700/50 transition-all duration-500 overflow-hidden rounded-2xl",
  step2img1:
    "pointer-events-none w-[50%] border border-border-100/10 transition-all duration-500 dark:border-border-700 rounded-2xl overflow-hidden",
//   step2img2:
//     "pointer-events-none w-[40%] border border-border-100/10 dark:border-border-700 transition-all duration-500 rounded-2xl overflow-hidden",
  step3img:
    "pointer-events-none w-[90%] border border-border-100/10 dark:border-border-700 rounded-2xl transition-all duration-500 overflow-hidden",
  step4img:
    "pointer-events-none w-[90%] border border-border-100/10 dark:border-border-700 rounded-2xl transition-all duration-500 overflow-hidden",
} as const

/**
 * Main component that orchestrates the multi-step animation sequence.
 * Manages state transitions, handles animation timing, and prevents
 * animation conflicts through the isAnimating flag.
 */
const CursorAnimation = () => {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await controls.start({ x: 120, y: 120, transition: { duration: 1 } });
      await controls.start({ scale: 0.9, transition: { duration: 0.2 } });
      await controls.start({ scale: 1, transition: { duration: 0.2 } });
      await controls.start({ x: -80, y: 120, transition: { duration: 1 } });
      await controls.start({ scale: 0.9, transition: { duration: 0.2 } });
      await controls.start({ scale: 1, transition: { duration: 0.2 } });
    };

    sequence();
  }, [controls]);

  return (
    <motion.img
      src="/cursor.png"
      alt="cursor"
      className="absolute w-12 h-12 z-49 pointer-events-none"
      initial={{ x: 0, y: 0, scale: 1 }}
      animate={controls}
    />
  );
};

const CursorAnimation2 = () => {
  const controls = useAnimation();

  useEffect(() => {
    const sequence = async () => {
      await controls.start({ x: 120, y: -130, transition: { duration: 1 } });
      await controls.start({ scale: 0.8, transition: { duration: 0.4 } });
      await controls.start({ scale: 1, transition: { duration: 0.4 } });
    //   await controls.start({ x: 120, y: -150, transition: { duration: 1 } });
    //   await controls.start({ scale: 0.9, transition: { duration: 0.2 } });
    //   await controls.start({ scale: 1, transition: { duration: 0.2 } });
    };

    sequence();
  }, [controls]);

  return (
    <motion.img
      src="/cursor.png"
      alt="cursor"
      className="absolute w-32 h-32 z-49 pointer-events-none"
      initial={{ x: 0, y: 0, scale: 1 }}
      animate={controls}
    />
  );
};

const CursorAnimation3 = () => {
  const controls = useAnimation();
  const controls2 = useAnimation();

  useEffect(() => {
    const sequence = async () => {
              await controls.start({ scale: 0.8, transition: { duration: 0.4 } });
      await controls.start({ scale: 1, transition: { duration: 0.4 } });
      await controls.start({ x: 200, y: -190, transition: { duration: 1 } });
    //   await controls.start({ x: 120, y: -150, transition: { duration: 1 } });
    //   await controls.start({ scale: 0.9, transition: { duration: 0.2 } });
    //   await controls.start({ scale: 1, transition: { duration: 0.2 } });
    };

    sequence();
  }, [controls]);

  useEffect(() => {
    const sequence = async () => {
     await controls2.start({ scale: 0.8, transition: { duration: 0.4 } });
      await controls2.start({ scale: 1, transition: { duration: 0.4 } });
      await controls2.start({ x: 40, y: -220, transition: { duration: 1 } });

    //   await controls.start({ x: 120, y: -150, transition: { duration: 1 } });
    //   await controls.start({ scale: 0.9, transition: { duration: 0.2 } });
    //   await controls.start({ scale: 1, transition: { duration: 0.2 } });
    };

    sequence();
  }, [controls2]);

  return (
    <>
        <motion.img
            src="/grab.png"
            alt="cursor"
            className="absolute w-32 h-32 z-49 pointer-events-none"
            initial={{ x: 0, y: 130, scale: 1 }}
            animate={controls}
            />
            <motion.img
            src="/angle.png"
            alt="angle"
            className="absolute w-64 z-49 pointer-events-none"
            initial={{ x: -160, y: 100, scale: 1 }}
            animate={controls2}
            />
    </>
  );
};


export function FeatureCarousel({
  image,
  step1img1Class = defaultClasses.step1img1,
//   step1img2Class = defaultClasses.step1img2,
  step2img1Class = defaultClasses.step2img1,
//   step2img2Class = defaultClasses.step2img2,
  step3imgClass = defaultClasses.step3img,
//   step4imgClass = defaultClasses.step4img,
  ...props
}: FeatureCarouselProps) {
  const { currentNumber: step, increment } = useNumberCycler()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleIncrement = () => {
    if (isAnimating) return
    setIsAnimating(true)
    increment()
  }

  const handleAnimationComplete = () => {
    setIsAnimating(false)
  }

  const renderStepContent = () => {
    const content = () => {
      switch (step) {
        case 0:
          /**
           * Layout: Two images side by side
           * - Left image (step1img1): 50% width, positioned left
           * - Right image (step1img2): 60% width, positioned right
           * Animation:
           * - Left image slides in from left
           * - Right image slides in from right with 0.1s delay
           * - Both use spring animation for smooth motion
           */
          return (
            <>
                <motion.div
                className="relative right-[40px] w-full h-full flex items-center justify-center overflow-hidden"
                onAnimationComplete={handleAnimationComplete}
                >
                <AnimatedStepImage
                    alt={image.alt}
                    className="max-w-full max-h-full mb-40 border-2 p-1 border-white-900/50 object-cover rounded-3xl"
                    src={image.step1light1}
                    preset="fadeInScale"
                    />
                {step === 0 && <CursorAnimation />}
                </motion.div>
            </>
          )
        case 1:
          /**
           * Layout: Two images with overlapping composition
           * - First image (step2img1): 50% width, positioned left
           * - Second image (step2img2): 40% width, overlaps first image
           * Animation:
           * - Both images fade in and scale up from 95%
           * - Second image has 0.1s delay for staggered effect
           * - Uses spring physics for natural motion
           */
          return (
            <motion.div
              className="relative w-full h-full flex items-center justify-center"
              onAnimationComplete={handleAnimationComplete}
            >
            <AnimatedStepImage
              alt={image.alt}
              className={clsx(step3imgClass, "rounded-2xl border-2 p-1 border-white-900/50 w-[1200px] h-[630px] min-w-[1200px] min-h-[630px] mt-12 object-cover")}
              src={image.step2light1}
              preset="fadeInScale"
              onAnimationComplete={handleAnimationComplete}
            />
            {step == 1 && <CursorAnimation2 />}
            </motion.div>
          )
          
        case 2:
          return (
            <motion.div
              className="relative w-full h-full flex items-center justify-center"
              onAnimationComplete={handleAnimationComplete}
            >
            <AnimatedStepImage
              alt={image.alt}
              className={clsx(step3imgClass, "rounded-2xl border-2 p-1 border-white-900/50 w-[1200px] h-[630px] min-w-[1200px] min-h-[630px] mt-12 object-cover")}
              src={image.step3light}
              preset="fadeInScale"
              onAnimationComplete={handleAnimationComplete}
            />
             {step == 2 && <CursorAnimation3 />} 
            </motion.div>
          )
        case 3:
          /**
           * Layout: Final showcase layout
           * - Container: Centered, 60% width on desktop
           * - Image (cult): 90% width, positioned slightly up
           * Animation:
           * - Container fades in and scales up
           * - Image follows with 0.1s delay
           * - Both use spring physics for natural motion
           */
          return (
            <motion.div
              className={clsx(
                "absolute left-2/4 top-1/3 flex w-[100%] -translate-x-1/2 -translate-y-[33%] flex-col gap-12 text-center text-2xl font-bold md:w-[60%]"
              )}
              {...ANIMATION_PRESETS.fadeInScale}
              onAnimationComplete={handleAnimationComplete}
            >
              <AnimatedStepImage
                alt={image.alt}
                className="pointer-events-none top-[50%] w-[90%] overflow-hidden rounded-2xl border border-neutral-100/10 md:left-[35px] md:top-[30%] md:w-full dark:border-zinc-700"
                src={cult}
                preset="fadeInScale"
                delay={0.1}
              />
            </motion.div>
          )
        default:
          return null
      }
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          {...ANIMATION_PRESETS.fadeInScale}
          className="w-full h-full absolute"
        >
          {content()}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <FeatureCard {...props} step={step}>
      {renderStepContent()}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute left-[12rem] top-5 z-0 h-full w-full cursor-pointer md:left-0"
      >
        <Steps current={step} onChange={() => {}} steps={steps} />
      </motion.div>
      <motion.div
        className="absolute right-0 top-0 z-0 h-full w-full cursor-pointer md:left-0"
        onClick={handleIncrement}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      />
    </FeatureCard>
  )
}
