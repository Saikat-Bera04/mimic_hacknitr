"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const colors = [
  { name: 'Default', value: 'hsl(0 0% 98%)' },
  { name: 'Golden', value: 'hsl(45 100% 51%)' },
  { name: 'Cyan', value: 'hsl(180 100% 50%)' },
  { name: 'Sky', value: 'hsl(197 71% 73%)' },
  { name: 'Purple', value: 'hsl(283 53% 54%)' },
  { name: 'Emerald', value: 'hsl(145 63% 49%)' },
  { name: 'Rose', value: 'hsl(346 84% 61%)' },
];

export function ColorSwitcher({ inSidebar = false }: { inSidebar?: boolean}) {
  const { setDynamicTextColor } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn(
          "hover:bg-secondary border-none",
          inSidebar && "text-neutral-200 hover:bg-neutral-700 hover:text-white"
          )}>
          <Palette className="h-5 w-5 text-primary" />
          <span className="sr-only">Change Color Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {colors.map((color) => (
          <DropdownMenuItem key={color.name} onClick={() => setDynamicTextColor(color.value)}>
            <div className="flex items-center gap-2">
              <div 
                className="h-4 w-4 rounded-full border" 
                style={{ backgroundColor: color.value }} 
              />
              <span>{color.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}