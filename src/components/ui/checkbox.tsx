"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
            className
        )}
        {...props}
    />
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

const CheckboxIndicator = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Indicator>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Indicator>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Indicator
        ref={ref}
        className={cn("flex items-center justify-center text-current", className)}
        {...props}
    >
        <CheckIcon className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
))

export { Checkbox }
