import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DumpDetail, DumpSummary } from "./categories";

export const organizeDump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string }) => {
    const text = (input?.text ?? "").trim();
    if (!text) throw new Error("Kuch to likho — the dump is empty.");
    if (text.length > 6000) throw new Error("That dump is too long — keep it under 6000 characters.");
    return { text };
  })
  .handler(async ({ data, context }): Promise<DumpDetail> => {
    const { categorizeText, findPatterns } = await import("./brain.server");
    const aiItems = await categorizeText(data.text);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await context.supabase
      .from("dumps")
      .select("raw_text")
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    const insights = findPatterns([...(recent ?? []).map((d) => d.raw_text), data.text]);

    const { data: dump, error: dumpError } = await context.supabase
      .from("dumps")
      .insert({ user_id: context.userId, raw_text: data.text, insights })
      .select("id, raw_text, insights, created_at")
      .single();
    if (dumpError || !dump) throw new Error(dumpError?.message ?? "Could not save the dump");

    const rows = aiItems.map((item, index) => ({
      dump_id: dump.id,
      user_id: context.userId,
      category: item.category,
      text: item.text,
      due_date: item.dueDate,
      stakes: item.stakes,
      position: index,
    }));

    let items: DumpDetail["items"] = [];
    if (rows.length) {
      const { data: inserted, error: itemsError } = await context.supabase
        .from("dump_items")
        .insert(rows)
        .select("id, category, text, due_date, stakes, done, calendar_added, position");
      if (itemsError) throw new Error(itemsError.message);
      items = inserted ?? [];
    }

    return {
      id: dump.id,
      raw_text: dump.raw_text,
      insights: (dump.insights as string[]) ?? [],
      created_at: dump.created_at,
      items,
    };
  });

export const listDumps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DumpSummary[]> => {
    const { previewOf } = await import("./categories");
    const { data, error } = await context.supabase
      .from("dumps")
      .select("id, raw_text, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((d) => ({
      id: d.id,
      preview: previewOf(d.raw_text),
      created_at: d.created_at,
    }));
  });

export const getDump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data, context }): Promise<DumpDetail> => {
    const { data: dump, error } = await context.supabase
      .from("dumps")
      .select("id, raw_text, insights, created_at")
      .eq("id", data.id)
      .single();
    if (error || !dump) throw new Error("That dump could not be found");

    const { data: items } = await context.supabase
      .from("dump_items")
      .select("id, category, text, due_date, stakes, done, calendar_added, position")
      .eq("dump_id", data.id)
      .order("position", { ascending: true });

    return {
      id: dump.id,
      raw_text: dump.raw_text,
      insights: (dump.insights as string[]) ?? [],
      created_at: dump.created_at,
      items: items ?? [],
    };
  });

export const deleteDump = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("dumps").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; done?: boolean; calendarAdded?: boolean }) => ({
    id: String(input.id),
    done: typeof input.done === "boolean" ? input.done : undefined,
    calendarAdded: typeof input.calendarAdded === "boolean" ? input.calendarAdded : undefined,
  }))
  .handler(async ({ data, context }) => {
    const patch: { done?: boolean; calendar_added?: boolean } = {};
    if (data.done !== undefined) patch.done = data.done;
    if (data.calendarAdded !== undefined) patch.calendar_added = data.calendarAdded;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await context.supabase.from("dump_items").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
