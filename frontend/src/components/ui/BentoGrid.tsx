import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { useUser } from "@clerk/clerk-react";
import { Expand, MonitorSmartphone, Palette, Pencil, ScanLineIcon, Sparkles, Zap } from "lucide-react";

const features = [
  {
    Icon: Pencil,
    name: "Draw Freely",
    description: "Sketch like it's paper — but smarter. Draw lines, shapes, and doodles with ease.",
    href: "/canvas",
    cta: "Try Now",
    background: <img className="absolute bottom-0 w-full h-full object-cover opacity-50" src="/draw.png"/>,
    className: "lg:col-start-1 lg:row-start-1 lg:row-span-4 lg:col-span-1",
  },
  {
    Icon: Palette,
    name: "Color Picker",
    description: "Pick your vibe! - Customize colors with a full palette.",
    href: "/canvas",
    cta: "Try Now",
    background: <img className="absolute bottom-0 w-full h-full object-cover opacity-50" src="/color.png"/>,
    className: "lg:col-start-1 lg:row-start-5 lg:col-span-1 lg:row-span-3",
  },
  {
    Icon: Sparkles,
    name: "AI Solve",
    description: "Math? Physics? Done! - Let AI solve equations, problems, and drawings.",
    href: "/canvas",
    cta: "Try Now",
    background: <img className="absolute bottom-0 w-full h-full object-cover opacity-50" src="/ai.png"/>,
    className: "lg:col-start-3 lg:row-start-1 lg:col-span-1 lg:row-span-3",
  },
  {
    Icon: ScanLineIcon,
    name: "Image Recognition",
    description: "Draw it, and it tells you what it is.",
    href: "/canvas",
    cta: "Try Now",
    background: <img className="absolute bottom-0 w-full h-full object-cover opacity-60" src="/image.png"/>,
    className: "lg:col-start-3 lg:row-start-4 lg:col-span-1 lg:row-span-4",
  },
  {
    Icon: Expand,
    name: "Resize & Drag",
    description:
      "Total control over every shape - Move, resize, and rotate with freedom.",
    href: "/canvas",
    cta: "Try Now",
    background: <img className="absolute bottom-0 w-full h-full object-cover opacity-60" src="/select.png"/>,
    className: "lg:col-start-2 lg:row-start-3 lg:col-span-1 lg:row-span-3",
  },
  {
    Icon: Zap,
    name: "Real-Time AI Feedback",
    description:
      "Get answers instantly, with no delay — responses as fast as you draw.",
    href: "/canvas",
    cta: "Try Now",
    background: <img className="absolute bottom-0 w-full h-full object-cover opacity-50" src="/fast.png"/>,
    className: "lg:col-start-2 lg:row-start-1 lg:col-span-1 lg:row-span-2",
  },
  {
    Icon: MonitorSmartphone,
    name: "Cross-Device Friendly",
    description:
      "Use it anywhere - Seamless on desktop, tablet, or phone.",
    href: "/canvas",
    cta: "Try Now",
    background: <img className="absolute bottom-0 w-full h-full object-cover opacity-50" src="/cross.png"/>,
    className: "lg:col-start-2 lg:row-start-6 lg:col-span-1 lg:row-span-2",
  },
];

export function Bento() {
  const { isSignedIn } = useUser();
  return (
    <BentoGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[280px] sm:auto-rows-[300px] lg:grid-rows-[repeat(7,_minmax(0,_110px))] gap-3 sm:gap-4 mt-12 sm:mt-16 lg:mt-24 px-4 sm:px-8 md:px-16 lg:px-32 xl:px-64 mb-16 sm:mb-24 lg:mb-32">
      {features.map((feature) => {
        const href = isSignedIn ? feature.href : "/sign-in";
        return <BentoCard key={feature.name} {...feature} href={href} />;
      })}
    </BentoGrid>
  );
}
