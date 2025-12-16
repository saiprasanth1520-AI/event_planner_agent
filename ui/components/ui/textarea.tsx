import * as React from "react";

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={`border rounded p-2 w-full ${className}`} {...props} />
  );
}
