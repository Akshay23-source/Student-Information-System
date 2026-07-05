
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "users read own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users self-assign role on signup" ON public.user_roles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins manage roles" ON public.user_roles
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Link students to their auth user so a student can fetch their own row
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Replace permissive student policies with role-aware ones
DROP POLICY IF EXISTS "auth read students" ON public.students;
DROP POLICY IF EXISTS "auth insert students" ON public.students;
DROP POLICY IF EXISTS "auth update students" ON public.students;
DROP POLICY IF EXISTS "auth delete students" ON public.students;

-- Staff (admin/teacher) can do everything; students can read only their own row
CREATE POLICY "staff read all students" ON public.students
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'teacher')
  OR auth.uid() = user_id
);

CREATE POLICY "staff insert students" ON public.students
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "staff update students" ON public.students
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "admin delete students" ON public.students
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
