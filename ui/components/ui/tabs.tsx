import * as React from "react";

export function Tabs({
  children,
  value,
  onValueChange,
  ...props
}: React.PropsWithChildren<
  {
    value?: string;
    onValueChange?: (val: string) => void;
  } & React.HTMLAttributes<HTMLDivElement>
>) {
  return <div {...props}>{children}</div>;
}

export function TabsList({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex gap-2 mb-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  children,
  value,
  ...props
}: React.PropsWithChildren<
  { value: string } & React.ButtonHTMLAttributes<HTMLButtonElement>
>) {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

export function TabsContent({
  children,
  value,
  className = "",
  ...props
}: React.PropsWithChildren<
  { value: string } & React.HTMLAttributes<HTMLDivElement>
>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
