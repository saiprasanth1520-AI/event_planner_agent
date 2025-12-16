import * as React from "react";

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={`border rounded p-2 w-full ${className}`} {...props} />
  );
}
