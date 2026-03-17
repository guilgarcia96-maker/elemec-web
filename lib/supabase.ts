import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client con service role key — solo para uso en server (API routes)
export const supabase = createClient(supabaseUrl, supabaseKey);
