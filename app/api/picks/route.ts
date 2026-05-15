import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('picks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase picks query failed:', error.message);
      return NextResponse.json({ error: 'Unable to load picks' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('GET /api/picks error:', error);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
