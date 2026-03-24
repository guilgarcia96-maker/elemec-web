-- ============================================================
-- 007: Reset admin_users para permitir re-creación con nueva contraseña
-- Se ejecuta una vez. El login re-creará el usuario automáticamente.
-- ============================================================

TRUNCATE public.admin_users CASCADE;
