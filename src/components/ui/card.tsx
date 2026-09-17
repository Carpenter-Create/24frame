import { cn } from "@/lib/cn";
import { HOUSE_CARD_PAD } from "@/lib/house-shell";

// The one Card — reconciled from watershedportal's PlatformCard (composite API),
// rethemed to GC tokens. Card is the frame; sections carry padding (shadcn convention).
// House shell: r16 · pad 16 · hairline only · no soft shadow.
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("card-surface", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-1 border-b border-hairline px-[var(--space-4)] py-[var(--space-3)]", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("t-body font-medium text-ink", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("t-body-sm text-ink-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(HOUSE_CARD_PAD, className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("border-t border-hairline px-[var(--space-4)] py-[var(--space-3)]", className)} {...props} />;
}
