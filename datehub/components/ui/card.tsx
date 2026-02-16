import type { HTMLAttributes } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

function Card({ className = "", children, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] backdrop-blur-xl bg-white/[0.03] p-6 shadow-lg shadow-black/20 ${hoverable ? "hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-zinc-100 ${className}`} {...props}>
      {children}
    </h3>
  );
}

function CardDescription({ className = "", children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-zinc-400 ${className}`} {...props}>
      {children}
    </p>
  );
}

function CardContent({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
