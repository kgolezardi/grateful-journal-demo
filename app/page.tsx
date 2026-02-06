'use client'

import { useState, useEffect } from 'react'
import { saveEntry, getEntries, deleteEntry } from './actions'
import { Trash2 } from 'lucide-react'

export default function CombinedDemo() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [randomNum, setRandomNum] = useState<number | null>(null)
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    setRandomNum(Math.random())
  }, [])

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    const data = await getEntries()
    setEntries(data)
  }

  const handleSave = async () => {
    if (!text.trim()) return
    setIsSaving(true)

    const result = await saveEntry(text)

    if (result.success) {
      setText('')
      await loadEntries()
    }

    setIsSaving(false)
  }

  const handleDelete = async (id: number) => {
    const result = await deleteEntry(id)
    if (result.success) {
      await loadEntries()
    } else {
      alert("Failed to delete")
    }
  }

  return (
    <main className="p-10 max-w-lg mx-auto flex flex-col gap-12 font-sans">
      
      {/* SECTION 1: COUNTER */}
      <section className="p-6 border rounded-xl bg-blue-50">
        <h2 className="text-xl font-bold mb-4">1. Counter Logic</h2>
        <div className="flex items-center gap-4">
          <p className="text-lg">Count is: <span className="font-mono font-bold">{count}</span></p>
          <button 
            onClick={() => setCount(count + 1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Increment
          </button>
        </div>
      </section>

      {/* SECTION 2: INPUT & ALERT */}
      <section className="p-6 border rounded-xl bg-gray-50">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">New Entry</h2>
        <div className="flex flex-col gap-4">
          <textarea
            className="border-2 border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none resize-none h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind today?"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || !text.trim()}
            className={`p-3 rounded-lg text-white font-bold transition-colors duration-200 ${
              isSaving || !text.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Post Entry'}
          </button>

          <p className="text-sm text-gray-400">
            Character count: {text.length}
            <br/>
            Random: {randomNum ?? "Loading..."}
          </p>
        </div>
      </section>

      {/* LIST SECTION */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Recent Entries</h2>
        
        {entries.length === 0 ? (
          <p className="text-gray-400 italic">No entries yet. Start typing above!</p>
        ) : (
          entries.map((entry) => (
            <div 
              key={entry.id} 
              className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm flex justify-between items-start gap-4 group hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex-1">
                <p className="text-gray-800 whitespace-pre-wrap break-words">{entry.content}</p>
                <span className="text-xs text-gray-500 mt-2 block font-medium">
                  {new Date(entry.created_at).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              
              {/* 3. The Red Delete Button with Icon */}
              <button 
                onClick={() => handleDelete(entry.id)}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Delete entry"
                aria-label="Delete entry"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </section>

    </main>
  )
}
