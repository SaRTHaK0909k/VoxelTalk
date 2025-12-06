"use client"; // Keep this directive for client-side interactivity

import { useState } from "react";
import { Square, Circle, Type, Pencil, Pointer, Slash } from "lucide-react"; // Added Eraser
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // Assumes you have the cn utility from Shadcn UI setup
import { Dock, DockIcon } from "@/components/magicui/dock"; // Import Dock components
import { Separator } from "@/components/ui/separator"; // For separators in the dock

import { ColorPicker } from './ColorPicker';
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface ToolbarProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
  activeColor: string; // Add activeColor prop
  onColorSelect: (color: string) => void; // Add onColorSelect prop
}

export default function Toolbar({ activeTool, onToolSelect, activeColor, onColorSelect }: ToolbarProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false); // State to manage color picker popover
  const tools = [
    { name: 'selection', icon: <Pointer style={{ width: '20px', height: '20' }} className="w-4 h-4 text-white" />, label: "Select Tool" },
    { name: 'pencil', icon: <Pencil style={{ width: '20px', height: '20' }} className="w-4 h-4 text-white" />, label: "Pen Tool" },
    { name: 'rectangle', icon: <Square style={{ width: '20px', height: '20' }} className="w-4 h-4 text-white" />, label: "Rectangle Tool" },
    { name: 'circle', icon: <Circle style={{ width: '20px', height: '20' }} className="w-4 h-4 text-white" />, label: "Circle Tool" },
    { name: 'line', icon: <Slash style={{ width: '20px', height: '20' }} className="w-4 h-4 text-white" />, label: "Line Tool" },
    { name: 'text', icon: <Type style={{ width: '20px', height: '20' }} className="w-4 h-4 text-white" />, label: "Text Tool" },
  ];

  return (
    <TooltipProvider>
      <Dock direction="middle">
        {tools.map((tool) => (
          <DockIcon key={tool.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onToolSelect(tool.name)}
                  variant={"ghost"} // Use 'default' for active, 'ghost' for inactive
                  size="icon"
                  className={cn(
                    "w-12 h-12 rounded-full bg-transparent hover:bg-zinc-800", // Increased size for better touch target
                    activeTool === tool.name && " bg-zinc-900" // Highlight active tool
                  )}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          </DockIcon>
        ))}
        <Separator orientation="vertical" className="h-10 bg-zinc-600" />

         <DockIcon>
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant={"ghost"}
                    size="icon"
                    className="w-12 h-12 rounded-full bg-transparent hover:bg-zinc-800"
                  >
                    <div
                      className="h-5 p-3 rounded-full shadow-sm"
                      style={{ backgroundColor: activeColor }}
                    />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Color Picker</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-[240px] p-3 bg-zinc-800 border-zinc-800"> {/* Matches original ColorPicker popover width */}
              <ColorPicker color={activeColor} onChange={onColorSelect} />
            </PopoverContent>
          </Popover>
        </DockIcon>
      </Dock>
    </TooltipProvider>
  );
}