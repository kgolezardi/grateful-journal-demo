'use client'

import { useState, useEffect } from 'react'
import { saveEntry, deleteEntry, getEntries } from '@/app/journal/actions'
import { Trash2 } from 'lucide-react'

// We accept the initial data from the server
export default function JournalUI({ initialEntries, email }: { initialEntries: any[], email?: string }) {
  // --- YOUR EXISTING STATE ---
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [randomNum, setRandomNum] = useState<number | null>(null)
  
  // Initialize with server data instead of empty array
  const [entries, setEntries] = useState<any[]>(initialEntries)

  // --- YOUR EXISTING EFFECTS ---
  useEffect(() => {
    setRandomNum(Math.random())
  }, [])
  
  const refreshEntries = async () => {
    const data = await getEntries()
    setEntries(data)
  }

  const handleSave = async () => {
    if (!text.trim()) return
    setIsSaving(true)

    const result = await saveEntry(text)

    if (result.success) {
      setText('')
      await refreshEntries()
    }
    setIsSaving(false)
  }

  const handleDelete = async (id: number) => {
    // Optimistic update: remove immediately from UI
    setEntries(current => current.filter(e => e.id !== id))
    
    const result = await deleteEntry(id)
    if (!result.success) {
      alert("Failed to delete")
      await refreshEntries() // Revert on failure
    }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-12 font-sans w-full">
      
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
            className="border-2 border-gray-300 p-3 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-400 outline-none resize-none h-32"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What's on your mind, ${email}?`}
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
            Chars: {text.length} | Random: {randomNum ?? "Loading..."}
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
              className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm flex justify-between items-start gap-4 group hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <p className="text-gray-800 whitespace-pre-wrap">{entry.content}</p>
                <span className="text-xs text-gray-500 mt-2 block font-medium">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
              <button 
                onClick={() => handleDelete(entry.id)}
                className="text-gray-400 hover:text-red-600 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </section>

    </div>
  )
}
