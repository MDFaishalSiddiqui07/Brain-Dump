import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DumpSummary } from "@/lib/categories";

type Props = {
  open: boolean;
  dumps: DumpSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function HistorySidebar({ open, dumps, activeId, onSelect, onDelete }: Props) {
  return (
    <aside
      className={cn(
        "shrink-0 overflow-hidden border-border/70 transition-all duration-300",
        open ? "w-full border-b md:w-72 md:border-r md:border-b-0" : "w-0 border-0",
      )}
      aria-hidden={!open}
    >
      <div className="flex h-full w-full flex-col gap-1 p-3 md:w-72">
        <h2 className="px-2 pb-2 font-display text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          History
        </h2>
        {dumps.length === 0 && (
          <p className="px-2 text-xs text-muted-foreground">Your past dumps will show up here.</p>
        )}
        <div className="flex flex-col gap-1 overflow-y-auto">
          {dumps.map((dump) => (
            <div
              key={dump.id}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-2 transition-colors",
                activeId === dump.id ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(dump.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium">{dump.preview}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(dump.created_at).toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDelete(dump.id)}
                aria-label="Delete this dump"
                className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
