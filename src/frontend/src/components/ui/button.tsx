import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-zinc-100 text-[#111111] hover:bg-white shadow-md rounded-xl transition-all font-bold": variant === "default",
            "bg-red-500 text-white hover:bg-red-600": variant === "destructive",
            "border border-[#2C2C2E] bg-[#1C1C1E] hover:bg-[#2C2C2E] text-zinc-100": variant === "outline",
            "bg-[#2C2C2E] text-zinc-100 hover:bg-[#3A3A3C]": variant === "secondary",
            "hover:bg-[#2C2C2E] hover:text-zinc-100 text-zinc-400": variant === "ghost",
            "text-slate-900 underline-offset-4 hover:underline": variant === "link",
            "px-6 py-3 min-h-[44px]": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
