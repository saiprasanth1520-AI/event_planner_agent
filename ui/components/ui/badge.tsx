import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "secondary" | "outline" | "default";
}

export function Badge({
  children,
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  let style = "px-2 py-1 rounded text-xs ";
  if (variant === "secondary") style += "bg-gray-200 text-gray-800";
  else if (variant === "outline")
    style += "border border-gray-400 text-gray-800";
  else style += "bg-blue-600 text-white";
  return (
    <span className={`${style} ${className}`} {...props}>
      {children}
    </span>
  );
}
