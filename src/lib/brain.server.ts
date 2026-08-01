const CATEGORY_IDS = ["urgent", "tasks", "deadlines", "errands", "ideas"] as const;

export type AiItem = {
  category: string;
  text: string;
  dueDate: string | null;
  stakes: number;
};

const SYSTEM_PROMPT = `You organize messy brain dumps. The user writes in English, Hindi, Hinglish or a mix.
Split the raw text into individual actionable fragments. Assign each fragment exactly one category:
- "urgent": time-sensitive AND high stakes (exam tomorrow, submission today, emergency)
- "deadlines": has an explicit date/time/day mentioned but is not an emergency
- "errands": physical work - buying, fetching, dropping, delivering something
- "tasks": to-dos with no hard deadline
- "ideas": soft notes, reminders, birthdays, thoughts, "yaad rakhna" type items
Rules: keep the user's own wording (lightly cleaned up) in the SAME language AND the same script the user used - if they wrote Hinglish in Roman letters, keep Roman letters, never convert to Devanagari. One fragment per item, no duplicates.
dueDate: a short human readable date/time if one is mentioned (e.g. "Kal 9am", "15 Aug"), otherwise null.
stakes: 1-5 integer, how high the consequences are. Only urgent items should usually be 4-5.`;

export async function categorizeText(raw: string): Promise<AiItem[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-5.6-sol",
      reasoning_effort: "none",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: raw },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "organized_brain_dump",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["items"],
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["category", "text", "dueDate", "stakes"],
                  properties: {
                    category: { type: "string", enum: [...CATEGORY_IDS] },
                    text: { type: "string" },
                    dueDate: { type: ["string", "null"] },
                    stakes: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    if (response.status === 429) throw new Error("AI is busy right now - try again in a moment.");
    if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`AI request failed [${response.status}]: ${body}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  let parsed: { items?: AiItem[] };
  try {
    parsed = JSON.parse(content) as { items?: AiItem[] };
  } catch {
    throw new Error("AI returned an unreadable response - please try again.");
  }

  return (parsed.items ?? [])
    .filter((item) => typeof item?.text === "string" && item.text.trim().length > 0)
    .map((item) => ({
      category: (CATEGORY_IDS as readonly string[]).includes(item.category) ? item.category : "tasks",
      text: item.text.trim(),
      dueDate: item.dueDate && String(item.dueDate).trim() ? String(item.dueDate).trim() : null,
      stakes: Math.min(5, Math.max(1, Math.round(Number(item.stakes) || 1))),
    }));
}

const STOP_WORDS = new Set([
  "this","that","then","with","have","hai","hain","kar","karna","karo","mein","aur","liye",
  "from","about","there","need","want","will","should","must","just","also","toh","yaad",
  "rakhna","bhi","nahi","hoga","gaya","raha","wala","some","very","much","more","done","going",
  "tomorrow","today","kal","aaj",
]);

export function findPatterns(texts: string[]): string[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    const seen = new Set<string>();
    for (const word of text.toLowerCase().match(/[a-z\u0900-\u097F]{4,}/g) ?? []) {
      if (STOP_WORDS.has(word) || seen.has(word)) continue;
      seen.add(word);
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, count]) => `"${word}" came up ${count} times this week`);
}
