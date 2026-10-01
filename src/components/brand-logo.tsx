import { cn } from "cn";

// Nome provisório: o produto ainda não tem marca definida
export const BRAND_NAME = "Avalia.ai";

type BrandLogoProps = {
  tone?: "light" | "dark";
  className?: string;
};

export function BrandLogo({ tone = "dark", className }: BrandLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-lg font-semibold tracking-[-0.02em]",
        tone === "light" ? "text-white" : "text-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 place-items-center rounded-lg",
          tone === "light"
            ? "bg-white/12 ring-1 ring-white/20"
            : "bg-primary text-primary-foreground",
        )}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="size-4.5 fill-current"
        >
          <path d="M12 2.6l2.82 6.06 6.63.8-4.9 4.54 1.28 6.56L12 17.3l-5.83 3.26 1.28-6.56-4.9-4.54 6.63-.8z" />
        </svg>
      </span>
      {BRAND_NAME}
    </span>
  );
}
