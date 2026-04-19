import type { HTMLAttributes, ReactNode } from "react";

type TripzaCardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "section";
  padding?: "none" | "sm" | "md";
  children?: ReactNode;
};

const pad = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
};

export function TripzaCard({
  as: Tag = "div",
  padding = "md",
  className = "",
  children,
  ...rest
}: TripzaCardProps) {
  return (
    <Tag className={`rounded-2xl border border-slate-200/80 bg-white shadow-soft ${pad[padding]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
