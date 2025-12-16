import * as React from "react";

export function Alert({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`p-4 border rounded bg-yellow-100 text-yellow-900 ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ children }: React.PropsWithChildren<{}>) {
  return <div className="font-bold mb-1">{children}</div>;
}

export function AlertDescription({ children }: React.PropsWithChildren<{}>) {
  return <div className="text-sm">{children}</div>;
}
