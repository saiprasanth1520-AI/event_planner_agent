import * as React from "react";

export function Label({
  children,
  className = "",
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block font-medium mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
}
