"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CircleCheck, CircleHelp } from "lucide-react";
import { useState } from "react";

const YEARLY_DISCOUNT = 20;

const tooltipContent = {
  tokens:
    "Tokens let you generate math solutions, plots, or analyses.",
};

const plans = [
  {
    name: "Explorer",
    price: 0,
    description:
      "Get started with 1,000 tokens to explore VoxelTalk's AI-powered math tools at your own pace.",
    features: [
      { title: "1,000 tokens/month", tooltip: tooltipContent.tokens },
      { title: "Community support" },
      { title: "Access to basic tools" },
      { title: "No credit card required" },
    ],
    buttonText: "Start Free",
  },
  {
    name: "Pro",
    price: 9.99,
    isRecommended: true,
    description:
      "Unlock 10,000 tokens per month for serious math work, equations, and problem-solving.",
    features: [
      { title: "10,000 tokens/month", tooltip: tooltipContent.tokens },
      { title: "Priority support" },
      { title: "Access to all tools" },
      { title: "Early access to new features" },
    ],
    buttonText: "Upgrade to Pro",
    isPopular: true,
  },
  {
    name: "Premium",
    price: 29.99,
    description:
      "Go unlimited. Get unrestricted access to all AI tools, help, and priority features.",
    features: [
      { title: "Unlimited tokens/month", tooltip: tooltipContent.tokens },
      { title: "Premium priority support" },
      { title: "Access to all tools & future releases" },
      { title: "Dedicated account manager" },
    ],
    buttonText: "Go Premium",
  },
];

const Pricing = () => {
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("monthly");

  return (
    <TooltipProvider>
      <div className="z-10 min-h-screen flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl text-white font-bold text-center tracking-tight">
          Pricing
        </h1>
        <Tabs
          value={selectedBillingPeriod}
          onValueChange={setSelectedBillingPeriod}
          className="mt-8"
        >
          <TabsList className="h-11 px-1.5 rounded-full bg-gray-700 text-white/70">
            <TabsTrigger value="monthly" className="py-1.5 rounded-full">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="py-1.5 rounded-full">
              Yearly (Save {YEARLY_DISCOUNT}%)
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-12 max-w-screen-lg mx-auto grid grid-cols-1 lg:grid-cols-3 items-center gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative bg-black/70 text-white border border-muted/50 rounded-xl p-6",
                {
                  "border-[3px] border-white py-10": plan.isPopular,
                }
              )}
            >
              {plan.isPopular && (
                <Badge className="absolute bg-white hover:bg-zinc-300 text-black top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                  Popular
                </Badge>
              )}
              <h3 className="text-lg font-medium">{plan.name}</h3>
              <p className="mt-2 text-4xl font-bold">
                $
                {selectedBillingPeriod === "monthly"
                  ? plan.price
                  : plan.price * 12 * ((100 - YEARLY_DISCOUNT) / 100)}
                <span className="ml-1.5 text-sm text-muted/80 font-normal">
                  /{selectedBillingPeriod}
                </span>
              </p>
              <p className="mt-4 font-medium text-muted/80">
                {plan.description}
              </p>

              <Button
                variant={plan.isPopular ? "secondary" : "default"}
                size="lg"
                className="w-full mt-6"
              >
                {plan.buttonText}
              </Button>
              <Separator className="my-8 bg-muted/50" />
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature.title} className="flex items-start gap-1.5">
                    <CircleCheck className="h-4 w-4 mt-1 text-green-600" />
                    {feature.title}
                    {feature.tooltip && (
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          <CircleHelp className="h-4 w-4 mt-1 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>{feature.tooltip}</TooltipContent>
                      </Tooltip>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Pricing;