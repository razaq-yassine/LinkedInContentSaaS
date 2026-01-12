import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border-2 border-[#E0DFDC] dark:border-slate-600 bg-white dark:bg-transparent px-3 py-2 text-base text-black dark:text-white shadow-sm transition-all outline-none placeholder:text-[#999999] dark:placeholder:text-slate-300 hover:border-[#0A66C2] focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
