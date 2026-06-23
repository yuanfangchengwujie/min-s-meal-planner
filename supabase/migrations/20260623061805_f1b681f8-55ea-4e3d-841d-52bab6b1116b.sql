
-- profiles: 一个用户一条
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  baby_name TEXT NOT NULL DEFAULT '敏宝',
  baby_age_months INT NOT NULL DEFAULT 24,
  known_allergens TEXT[] NOT NULL DEFAULT ARRAY['egg','wheat','milk'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- food_status: (user_id, food_id) 唯一
CREATE TABLE public.food_status (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('safe','untested','trialing','allergic')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, food_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_status TO authenticated;
GRANT ALL ON public.food_status TO service_role;
ALTER TABLE public.food_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own food_status" ON public.food_status FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- trials: 排敏日志
CREATE TABLE public.trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  result TEXT CHECK (result IN ('safe','allergic')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trials_user_idx ON public.trials(user_id, start_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trials TO authenticated;
GRANT ALL ON public.trials TO service_role;
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trials" ON public.trials FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER food_status_touch BEFORE UPDATE ON public.food_status
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trials_touch BEFORE UPDATE ON public.trials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 注册新用户时自动建一个 profile
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
