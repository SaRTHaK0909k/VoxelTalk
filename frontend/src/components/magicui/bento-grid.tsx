import { ArrowRightIcon } from "@radix-ui/react-icons";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
  "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-3xl",
  "bg-black/70 border border-white/20 [mask-image:linear-gradient(to_top, transparent, white)]",
  "transition-shadow duration-300 ease-in-out hover:shadow-[0_0_80px_15px_rgba(255,255,255,0.2)]",
  className,
)}
    {...props}
  >
    <div>{background}</div>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "linear-gradient(to top, rgba(255, 255, 255, 0.1), transparent), " +
          "linear-gradient(to right, rgba(255, 255, 255, 0.05), transparent 30%), " +
          "linear-gradient(to left, rgba(255, 255, 255, 0.05), transparent 30%)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom, left, right",
        backgroundSize: "100% 60%, 20% 100%, 20% 100%",
      }}
    />
    <div className="[mask-image:linear-gradient(to_top, transparent, white)] pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
      <Icon className="h-12 w-12 origin-left transform-gpu text-neutral-500 transition-all duration-300 ease-in-out group-hover:scale-75" />
      <h3 className="text-xl font-semibold text-neutral-300 dark:text-neutral-300">
        {name}
      </h3>
      <p className="max-w-lg text-neutral-400">{description}</p>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
      )}
    >
      <Button variant="outline" asChild size="sm" className="pointer-events-auto hover:bg-muted-foreground/95 hover:border-muted-foreground/95">
        <a href={href}>
          {cta}
          <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
        </a>
      </Button>
    </div>
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10" />
  </div>
);

export { BentoCard, BentoGrid };
