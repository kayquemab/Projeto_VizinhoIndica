import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null | undefined;
  count?: number | null;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRating({
  value,
  count,
  size = "md",
  showValue = true,
  className,
}: StarRatingProps) {
  const nota = typeof value === "number" ? value : 0;
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Star className={cn(sizes[size], "fill-accent text-accent")} strokeWidth={1.5} />
      {showValue && (
        <span className="text-sm font-semibold text-foreground">
          {nota > 0 ? nota.toFixed(1) : "—"}
        </span>
      )}
      {typeof count === "number" && count > 0 && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
