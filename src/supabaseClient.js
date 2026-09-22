// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// URL corregida exactamente
const supabaseUrl = "https://gfkblkxfpnmwkmbcybfb.supabase.co";

// Clave pública
const supabaseAnonKey = "sb_publishable_hl01szesaFBpXwKNa7cmEA_2RgYMC5Y";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);