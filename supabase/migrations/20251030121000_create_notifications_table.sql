-- Migration: Crear tabla notifications para Supabase
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo varchar(32) NOT NULL,
  mensaje text NOT NULL,
  leido boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_leido ON public.notifications(leido);

-- RLS: Solo el usuario dueño puede ver sus notificaciones
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuario puede ver sus notificaciones" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Usuario puede modificar sus notificaciones" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
