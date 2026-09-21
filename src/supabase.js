import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dafrfrwnwvnrysjtmjro.supabase.co';
const supabaseAnonKey = 'sb_publishable_zprsQ2TkLBtoIGKlDp3DQQ_KHEeVorC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);