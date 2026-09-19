import { cn } from "@/lib/cn";
import {
  newsStickyHeaderClass,
  type NewsStickySurface,
} from "@/lib/news-sticky";

// One sticky section-header wrapper for Home Industry news and
// /home/news. Surface token is the only fork — pin / z / blur stay
// on newsStickyHeaderClass.

export function NewsStickyHeader({
  surface,
  children,
  className,
}: {
  surface: NewsStickySurface;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-news-sticky-header={surface}
      className={cn(newsStickyHeaderClass(surface), className)}
    >
      {children}
    </div>
  );
}
