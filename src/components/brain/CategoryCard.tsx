import { CalendarPlus, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { DumpItem } from "@/lib/categories";
import { CATEGORIES } from "@/lib/categories";

type Props = {
  category: (typeof CATEGORIES)[number];
  items: DumpItem[];
  index: number;
  onToggleDone: (item: DumpItem) => void;
  onAddToCalendar: (item: DumpItem) => void;
};

export function CategoryCard({ category, items, index, onToggleDone, onAddToCalendar }: Props) {
  return (
    <section
      className="rise-in flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
      style={{ animationDelay: `${index * 70}ms` }}
      aria-label={category.label}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: category.accent }} />
      <header className="px-4 pt-4" style={{ backgroundColor: category.tint }}>
        <h3 className="font-display text-base font-semibold tracking-tight">
          <span aria-hidden="true">{category.emoji}</span> {category.label}
        </h3>
        <p className="pb-4 text-xs text-muted-foreground">
          {items.length ? `${items.length} item${items.length > 1 ? "s" : ""}` : category.hint}
        </p>
      </header>

      <ul className="flex flex-1 flex-col gap-2 p-3">
        {items.length === 0 && (
          <li className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
            Nothing here yet
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-border"
          >
            <div className="flex items-start gap-2.5">
              <Checkbox
                checked={item.done}
                onCheckedChange={() => onToggleDone(item)}
                aria-label={`Mark "${item.text}" as done`}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm leading-snug transition-all",
                    item.done && "text-muted-foreground line-through opacity-70",
                  )}
                >
                  {item.text}
                </p>
                {item.due_date && (
                  <p className="mt-1 text-xs font-medium" style={{ color: category.accent }}>
                    {item.due_date}
                  </p>
                )}
                {category.id === "deadlines" && (
                  <button
                    type="button"
                    onClick={() => onAddToCalendar(item)}
                    disabled={item.calendar_added}
                    className={cn(
                      "mt-2 inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium transition-all duration-300",
                      item.calendar_added
                        ? "scale-[1.02] border-transparent text-background"
                        : "hover:bg-accent",
                    )}
                    style={
                      item.calendar_added ? { backgroundColor: category.accent, color: "white" } : undefined
                    }
                  >
                    {item.calendar_added ? (
                      <>
                        <Check className="size-3" /> Added
                      </>
                    ) : (
                      <>
                        <CalendarPlus className="size-3" /> Add to Calendar
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
