-- Create Superuser Script
-- Run this AFTER you have signed up a user in the app
-- Replace the email below with the email you used to sign up

-- Option 1: Update by email
UPDATE public.profiles 
SET role = 'SUPERUSUARIO', full_name = 'Super Admin', area = 'Administración'
WHERE email = 'tu-email@ejemplo.com';

-- Option 2: If you know the user ID (you can find it in auth.users table)
-- UPDATE public.profiles SET role = 'SUPERUSUARIO' WHERE id = 'your-user-uuid-here';

-- Option 3: Make the first user a superuser
-- UPDATE public.profiles SET role = 'SUPERUSUARIO' WHERE id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1);

-- Verify the superuser was created
SELECT id, email, full_name, role, area FROM public.profiles WHERE role = 'SUPERUSUARIO';
