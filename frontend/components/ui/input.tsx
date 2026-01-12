import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border-2 border-[#E0DFDC] dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-base text-black dark:text-white shadow-sm transition-all outline-none placeholder:text-[#999999] dark:placeholder:text-slate-400 hover:border-[#0A66C2] focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 disabled:cursor-not-allowed disabled:opacity-50 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-black dark:file:text-white md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
