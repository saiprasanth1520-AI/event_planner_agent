import * as React from "react";

export function Accordion({
  children,
  ...props
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  return <div {...props}>{children}</div>;
}

export function AccordionItem({
  children,
  value,
  ...props
}: React.PropsWithChildren<
  { value: string } & React.HTMLAttributes<HTMLDivElement>
>) {
  return <div {...props}>{children}</div>;
}

export function AccordionTrigger({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`font-semibold ${className}`} {...props}>
      {children}
    </button>
  );
}

export function AccordionContent({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
