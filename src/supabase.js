import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hvcnqqluazwucewvkdky.supabase.co'

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Y25xcWx1YXp3dWNld3ZrZGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDg0MzEsImV4cCI6MjA5MzgyNDQzMX0.qZwhgavlDpsq9sZNCE75kkD7Nk8YE0rcMOVZmjoNbhU'

export const supabase = createClient(supabaseUrl, supabaseKey)