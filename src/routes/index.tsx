import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Mic, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/brain/ThemeToggle";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brain Dump — Sort Your Mental Clutter in Seconds" },
      {
        name: "description",
        content:
          "Dump every thought into one box. Brain Dump sorts it into urgent items, tasks, deadlines, errands and ideas — by voice or text.",
      },
      { property: "og:title", content: "Brain Dump — Sort Your Mental Clutter in Seconds" },
      {
        property: "og:description",
        content:
          "Dump every thought into one box and get five organized, actionable cards back instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="app-shell min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center gap-2 px-5 py-5">
        <span className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
          <Brain className="size-4" /> Brain Dump
        </span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24">
        <section className="rise-in pt-10 md:pt-20">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Mental clutter → clarity
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
            Dump everything on your mind. Get it back sorted.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Type it or say it in one messy paragraph. Brain Dump splits it into urgent items, tasks,
            deadlines, errands and ideas — so you can actually start.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/auth">Start dumping — free</Link>
            </Button>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 text-sm text-muted-foreground">
              <Mic className="size-4" /> Voice input supported
            </span>
          </div>
        </section>

        <section className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORIES.map((category, index) => (
            <div
              key={category.id}
              className="rise-in overflow-hidden rounded-2xl border border-border/70 bg-card"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: category.accent }} />
              <div className="p-4" style={{ backgroundColor: category.tint }}>
                <p className="font-display text-sm font-semibold">
                  <span aria-hidden="true">{category.emoji}</span> {category.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{category.hint}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { title: "One box, zero structure", body: "No forms, no tags. Write like you think." },
            {
              title: "Sorted in seconds",
              body: "Urgent things float to the top, ranked by what's actually at stake.",
            },
            {
              title: "Patterns over time",
              body: "See what keeps coming back across your recent dumps.",
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border/70 bg-card p-5">
              <Sparkles className="size-4 text-muted-foreground" />
              <h2 className="mt-3 font-display text-base font-semibold">{feature.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
