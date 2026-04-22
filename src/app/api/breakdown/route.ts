import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { input } = await req.json()

  const subtasks = [
    { title: `Step 1: Understand — ${input.slice(0, 60)}` },
    { title: 'Step 2: List dependencies and constraints' },
    { title: 'Step 3: Execute in priority order' },
  ]

  const { data, error } = await supabase
    .from('tasks')
    .insert({ original_input: input, subtasks })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ task: data })
}
