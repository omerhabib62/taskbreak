import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const PROMPT = `You are a task-breakdown assistant. Given a messy task description, break it into 3-5 clear, actionable subtasks in logical order.

Respond ONLY with a valid JSON array of objects with this exact shape:
[
  { "title": "short clear action (under 80 chars)", "rationale": "one-line why this step matters" }
]

No markdown, no code fences, no extra keys, no explanation outside the JSON array.

Task to break down:
`

export async function POST(req: Request) {
  const { input } = await req.json()

  if (!input || typeof input !== 'string' || !input.trim()) {
    return NextResponse.json({ error: 'input required' }, { status: 400 })
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    })

    const result = await model.generateContent(PROMPT + input)
    const text = result.response.text()

    let subtasks: unknown
    try {
      subtasks = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { error: 'Gemini returned invalid JSON', raw: text },
        { status: 500 },
      )
    }

    if (!Array.isArray(subtasks) || subtasks.length === 0) {
      return NextResponse.json(
        { error: 'Gemini returned non-array or empty result', raw: subtasks },
        { status: 500 },
      )
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({ original_input: input, subtasks })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ task: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Gemini error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
