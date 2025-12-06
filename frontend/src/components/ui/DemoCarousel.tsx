import { cn } from "@/lib/utils"
import { FeatureCarousel } from "../cult-ui/Demo"

export default function StyledExample() {
  return (
    <FeatureCarousel
      title="Custom Styled Features"
      description="With custom positioning and effects"
      step1img1Class={cn(
        "pointer-events-none w-[50%] border border-stone-100/10",
        "rounded-2xl left-[25%] top-[50%]",
        "hover:scale-105 transition-transform"
      )}
      image={{
        step1light1: "/step1.png",
        //step1light2: "/public/logoonly.png",
        step2light1: "/step2.png",
        // step2light2: "/public/logoonly.png",
        step3light: "/step3.png",
        alt: "Feature showcase",
      }}
      bgClass="bg-gradient-to-tr from-black/90 to-zinc-800/90"
    />
  )
}
