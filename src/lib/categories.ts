export const CATEGORIES = [
  {
    id: "urgent",
    label: "Urgent",
    emoji: "⚡",
    hint: "Time-sensitive, high stakes",
    accent: "var(--cat-urgent)",
    tint: "var(--cat-urgent-soft)",
  },
  {
    id: "tasks",
    label: "Tasks",
    emoji: "📚",
    hint: "To-dos without a hard deadline",
    accent: "var(--cat-tasks)",
    tint: "var(--cat-tasks-soft)",
  },
  {
    id: "deadlines",
    label: "Deadlines",
    emoji: "📅",
    hint: "Date or time attached",
    accent: "var(--cat-deadlines)",
    tint: "var(--cat-deadlines-soft)",
  },
  {
    id: "errands",
    label: "Errands",
    emoji: "🛒",
    hint: "Buy, fetch, deliver",
    accent: "var(--cat-errands)",
    tint: "var(--cat-errands-soft)",
  },
  {
    id: "ideas",
    label: "Ideas & Reminders",
    emoji: "💡",
    hint: "Soft notes, birthdays, yaad rakhna",
    accent: "var(--cat-ideas)",
    tint: "var(--cat-ideas-soft)",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type DumpItem = {
  id: string;
  category: string;
  text: string;
  due_date: string | null;
  stakes: number;
  done: boolean;
  calendar_added: boolean;
  position: number;
};

export type DumpDetail = {
  id: string;
  raw_text: string;
  insights: string[];
  created_at: string;
  items: DumpItem[];
};

export type DumpSummary = {
  id: string;
  preview: string;
  created_at: string;
};

export function previewOf(text: string) {
  const words = text.trim().split(/\s+/).slice(0, 5).join(" ");
  return words.length ? words + (text.trim().split(/\s+/).length > 5 ? "…" : "") : "Empty dump";
}