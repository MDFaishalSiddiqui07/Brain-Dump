CREATE TABLE public.dumps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  raw_text TEXT NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dump_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dump_id UUID NOT NULL REFERENCES public.dumps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  due_date TEXT,
  stakes INTEGER NOT NULL DEFAULT 1,
  done BOOLEAN NOT NULL DEFAULT false,
  calendar_added BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX dumps_user_created_idx ON public.dumps (user_id, created_at DESC);
CREATE INDEX dump_items_dump_idx ON public.dump_items (dump_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dumps TO authenticated;
GRANT ALL ON public.dumps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dump_items TO authenticated;
GRANT ALL ON public.dump_items TO service_role;

ALTER TABLE public.dumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dump_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own dumps" ON public.dumps FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage their own dump items" ON public.dump_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);