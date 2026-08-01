import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Brain, Loader2, LogOut, Mic, PanelLeft, Plus, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CategoryCard } from "@/components/brain/CategoryCard";
import { HistorySidebar } from "@/components/brain/HistorySidebar";
import { ThemeToggle } from "@/components/brain/ThemeToggle";
import { CATEGORIES, type DumpDetail, type DumpItem } from "@/lib/categories";
import { deleteDump, getDump, listDumps, organizeDump, updateItem } from "@/lib/brain.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Your Workspace | Brain Dump" },
      {
        name: "description",
        content:
          "Dump every thought in one box and watch it sort itself into urgent items, tasks, deadlines, errands and ideas.",
      },
      { property: "og:title", content: "Your Workspace | Brain Dump" },
      {
        property: "og:description",
        content: "Turn messy mental clutter into five organized, actionable cards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Workspace,
});

const SAMPLE =
  "kal physics ka exam hai bilkul padha nahi, mummy ke liye dawai leni hai medical se, project report friday tak submit karni hai, gym join karna chahiye finally, riya ka birthday next week hai gift dekhna hai, laptop charger kharab ho gaya naya lena padega";

function Workspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const organize = useServerFn(organizeDump);
  const loadDump = useServerFn(getDump);
  const removeDump = useServerFn(deleteDump);
  const patchItem = useServerFn(updateItem);
  const fetchDumps = useServerFn(listDumps);

  const [text, setText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [current, setCurrent] = useState<DumpDetail | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const historyQuery = useQuery({
    queryKey: ["dumps"],
    queryFn: () => fetchDumps(),
  });

  const organizeMutation = useMutation({
    mutationFn: (raw: string) => organize({ data: { text: raw } }),
    onSuccess: (dump) => {
      setCurrent(dump);
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input isn't supported in this browser — try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setText((prev) => (prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
    };
    recognition.onerror = () => {
      toast.error("Couldn't hear that — check the mic permission.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const handleSelectDump = async (id: string) => {
    try {
      const dump = await loadDump({ data: { id } });
      setCurrent(dump);
      setText(dump.raw_text);
    } catch {
      toast.error("Could not open that dump.");
    }
  };

  const handleDeleteDump = async (id: string) => {
    try {
      await removeDump({ data: { id } });
      if (current?.id === id) setCurrent(null);
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
    } catch {
      toast.error("Could not delete that dump.");
    }
  };

  const mutateItem = (item: DumpItem, patch: Partial<DumpItem>) => {
    setCurrent((prev) =>
      prev
        ? { ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, ...patch } : i)) }
        : prev,
    );
  };

  const handleToggleDone = (item: DumpItem) => {
    mutateItem(item, { done: !item.done });
    void patchItem({ data: { id: item.id, done: !item.done } }).catch(() => {
      mutateItem(item, { done: item.done });
      toast.error("Could not save that change.");
    });
  };

  const handleAddToCalendar = (item: DumpItem) => {
    mutateItem(item, { calendar_added: true });
    void patchItem({ data: { id: item.id, calendarAdded: true } }).catch(() => {
      mutateItem(item, { calendar_added: false });
    });
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const items = current?.items ?? [];

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/60 bg-background/70 px-3 py-2 backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Toggle history"
        >
          <PanelLeft className="size-4" />
        </Button>
        <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
          <Brain className="size-4" /> Brain Dump
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrent(null);
              setText("");
            }}
          >
            <Plus className="size-4" /> New dump
          </Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        <HistorySidebar
          open={sidebarOpen}
          dumps={historyQuery.data ?? []}
          activeId={current?.id ?? null}
          onSelect={handleSelectDump}
          onDelete={handleDeleteDump}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Jo bhi dimaag mein chal raha hai, likh do
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One messy paragraph in. Five sorted cards out.
          </p>

          <div className="relative mt-5 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Jo bhi dimaag mein chal raha hai, likh do..."
              className="min-h-40 resize-none border-0 bg-transparent pr-12 text-base shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant={listening ? "default" : "outline"}
              size="icon"
              onClick={listening ? stopListening : startListening}
              aria-label={listening ? "Stop recording" : "Start voice input"}
              className="absolute top-4 right-4 rounded-full"
            >
              {listening ? <Square className="size-4" /> : <Mic className="size-4" />}
            </Button>

            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <Button
                onClick={() => organizeMutation.mutate(text)}
                disabled={organizeMutation.isPending || !text.trim()}
                className="rounded-full"
              >
                {organizeMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Organizing…
                  </>
                ) : (
                  <>Organize My Brain 🧠</>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setText("")}>
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-muted-foreground"
                onClick={() => setText(SAMPLE)}
              >
                Try an example
              </Button>
            </div>
          </div>

          {listening && (
            <p className="mt-3 text-sm text-muted-foreground">Listening… bolte raho.</p>
          )}

          {current?.insights?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {current.insights.map((insight) => (
                <span
                  key={insight}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1 text-xs text-muted-foreground"
                >
                  <Sparkles className="size-3" /> {insight}
                </span>
              ))}
            </div>
          ) : null}

          {current && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {CATEGORIES.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                  items={items
                    .filter((item) => item.category === category.id)
                    .sort((a, b) =>
                      category.id === "urgent" ? b.stakes - a.stakes : a.position - b.position,
                    )}
                  onToggleDone={handleToggleDone}
                  onAddToCalendar={handleAddToCalendar}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
