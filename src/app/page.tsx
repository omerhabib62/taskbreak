'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [input, setInput] = useState('')
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    setTasks(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    await fetch('/api/breakdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })
    setInput('')
    await loadTasks()
    setLoading(false)
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">TaskBreak</h1>
      <p className="text-gray-600 mb-8">Give it a messy task, get structured subtasks.</p>

      <form onSubmit={handleSubmit} className="mb-8">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. prep the Atompoint Loom while shipping audit engine this week"
          className="w-full p-3 border rounded-lg mb-2 min-h-24"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Breaking down...' : 'Break it down'}
        </button>
      </form>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="border rounded-lg p-4">
            <p className="font-medium mb-2">{task.original_input}</p>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              {(task.subtasks as any[]).map((sub, i) => (
                <li key={i}>{sub.title || sub}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </main>
  )
}
