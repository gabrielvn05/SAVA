-- SAVA Database Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'ADMINISTRATIVO' CHECK (role IN ('DECANO', 'SECRETARIA', 'ADMINISTRATIVO', 'DIRECTOR_AREA', 'SUPERUSUARIO')),
  area TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create request_types table
CREATE TABLE IF NOT EXISTS public.request_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  requires_attachment BOOLEAN DEFAULT FALSE,
  max_days INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create requests table
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type_id UUID NOT NULL REFERENCES public.request_types(id),
  status TEXT NOT NULL DEFAULT 'BORRADOR' CHECK (status IN ('BORRADOR', 'ENVIADO', 'EN_REVISION', 'REVISADO', 'APROBADO', 'RECHAZADO', 'DEVUELTO')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT NOT NULL,
  observations TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);

-- 4. Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create delegated_permissions table
CREATE TABLE IF NOT EXISTS public.delegated_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  granted_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('VIEW_REPORTS', 'VIEW_AREA_REQUESTS', 'REVIEW_REQUESTS', 'APPROVE_REQUESTS', 'MANAGE_USERS')),
  area TEXT,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create request_history table
CREATE TABLE IF NOT EXISTS public.request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  performed_by UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegated_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_history ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Superusers can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERUSUARIO')
);
CREATE POLICY "Superusers can insert profiles" ON public.profiles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERUSUARIO')
);
CREATE POLICY "Superusers can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERUSUARIO')
);

-- 9. RLS Policies for request_types (everyone can read, only superusers can modify)
CREATE POLICY "Anyone can view request types" ON public.request_types FOR SELECT USING (true);
CREATE POLICY "Superusers can manage request types" ON public.request_types FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERUSUARIO')
);

-- 10. RLS Policies for requests
CREATE POLICY "Users can view their own requests" ON public.requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own requests" ON public.requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own draft requests" ON public.requests FOR UPDATE USING (user_id = auth.uid() AND status = 'BORRADOR');
CREATE POLICY "Reviewers can view area requests" ON public.requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SECRETARIA', 'DECANO', 'DIRECTOR_AREA', 'SUPERUSUARIO')
  )
);
CREATE POLICY "Reviewers can update requests" ON public.requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('SECRETARIA', 'DECANO', 'DIRECTOR_AREA', 'SUPERUSUARIO')
  )
);

-- 11. RLS Policies for attachments
CREATE POLICY "Users can view attachments of their requests" ON public.attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);
CREATE POLICY "Users can add attachments to their requests" ON public.attachments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);
CREATE POLICY "Reviewers can view all attachments" ON public.attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('SECRETARIA', 'DECANO', 'DIRECTOR_AREA', 'SUPERUSUARIO'))
);

-- 12. RLS Policies for delegated_permissions
CREATE POLICY "Users can view their delegated permissions" ON public.delegated_permissions FOR SELECT USING (granted_to = auth.uid());
CREATE POLICY "Superusers can manage all permissions" ON public.delegated_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERUSUARIO')
);

-- 13. RLS Policies for request_history
CREATE POLICY "Users can view history of their requests" ON public.request_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_id AND r.user_id = auth.uid())
);
CREATE POLICY "System can insert history" ON public.request_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Reviewers can view all history" ON public.request_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('SECRETARIA', 'DECANO', 'DIRECTOR_AREA', 'SUPERUSUARIO'))
);

-- 14. Insert default request types
INSERT INTO public.request_types (name, code, description, requires_attachment, max_days) VALUES
  ('Certificado Médico', 'CERT_MED', 'Solicitud por certificado médico o incapacidad', true, 30),
  ('Calamidad Doméstica', 'CALAMIDAD', 'Solicitud por calamidad doméstica o familiar', false, 5),
  ('Permiso Personal', 'PERMISO', 'Solicitud de permiso personal', false, 3),
  ('Licencia de Maternidad', 'LIC_MAT', 'Licencia por maternidad', true, 126),
  ('Licencia de Paternidad', 'LIC_PAT', 'Licencia por paternidad', true, 14),
  ('Vacaciones', 'VACACIONES', 'Solicitud de período vacacional', false, 30),
  ('Compensatorio', 'COMPENSAT', 'Día compensatorio por trabajo extra', false, 1),
  ('Capacitación', 'CAPACIT', 'Permiso para asistir a capacitación', false, 5)
ON CONFLICT (code) DO NOTHING;

-- 15. Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, cedula, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data ->> 'cedula', NEW.id::text),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'ADMINISTRATIVO')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 16. Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 17. Function to generate request code
CREATE OR REPLACE FUNCTION public.generate_request_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  year_code TEXT;
  seq_num INTEGER;
BEGIN
  year_code := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO seq_num FROM public.requests WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  NEW.code := 'SOL-' || year_code || '-' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- 18. Trigger for request code generation
DROP TRIGGER IF EXISTS generate_request_code_trigger ON public.requests;
CREATE TRIGGER generate_request_code_trigger
  BEFORE INSERT ON public.requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_request_code();

-- Done! Now create your superuser by signing up in the app, 
-- then run this query replacing YOUR_USER_ID with the actual UUID:
-- UPDATE public.profiles SET role = 'SUPERUSUARIO' WHERE id = 'YOUR_USER_ID';
