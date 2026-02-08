'use client'

import { useState } from 'react'
import { saveEntry, deleteEntry, updateEntry, getEntries } from '@/app/journal/actions'
import { MoreHorizontal, Edit2, Trash2, Send, X, Check, Loader2 } from 'lucide-react'

type Entry = {
  id: number
  content: string
  created_at: string
  user_id: string
}

export default function JournalUI({ 
  initialEntries, 
  currentUserId,
  relationshipId,
  readOnly = false
}: { 
  initialEntries: Entry[], 
  currentUserId: string,
  relationshipId: string,
  readOnly?: boolean
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  
  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  
  // Menu State (Mobile friendly: click to open menu)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  // -- 1. REFRESH LOGIC (Keeps UI in sync) --
  const refresh = async () => {
    const freshData = await getEntries(relationshipId)
    setEntries(freshData)
  }

  // -- 2. SAVE (New Entry) --
  const handleSave = async () => {
    if (!text.trim()) return
    setIsSaving(true)
    
    // We cannot easily do optimistic updates here because we need the real ID from the DB
    // to allow editing/deleting immediately. So we wait.
    const result = await saveEntry(text)
    
    if (result.success) {
      setText('')
      await refresh() // Fetch the real entry with valid ID
    } else {
      alert("Failed to save entry.")
    }
    setIsSaving(false)
  }

  // -- 3. DELETE (With Error Rollback) --
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this memory?')) return

    // A. Snapshot current state
    const previousEntries = [...entries]

    // B. Optimistic Update (Instant)
    setEntries(current => current.filter(e => e.id !== id))
    setOpenMenuId(null) // Close menu

    // C. Server Action
    const result = await deleteEntry(id)

    // D. Rollback on Failure
    if (!result.success) {
      alert("Failed to delete. Restoring entry...")
      setEntries(previousEntries)
    }
  }

  // -- 4. EDIT LOGIC --
  const startEdit = (entry: Entry) => {
    setEditingId(entry.id)
    setEditText(entry.content)
    setOpenMenuId(null) // Close menu
  }

  const saveEdit = async (id: number) => {
    const previousEntries = [...entries]

    // Optimistic
    setEntries(current => current.map(e => e.id === id ? { ...e, content: editText } : e))
    setEditingId(null)
    
    const result = await updateEntry(id, editText)

    if (!result.success) {
      alert("Failed to edit.")
      setEntries(previousEntries)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 pb-32">
      
      {/* INPUT AREA */}
      {!readOnly && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <textarea
            className="w-full p-3 text-base bg-transparent outline-none resize-none placeholder:text-gray-300 min-h-[100px]"
            placeholder="Share a moment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end pt-2 border-t border-gray-50 mt-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !text.trim()}
              className="bg-gray-900 text-white rounded-xl px-6 py-3 font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all text-sm shadow-md"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <>Post <Send size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* TIMELINE */}
      <div className="space-y-6">
        {entries.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p>No memories yet.</p>
          </div>
        ) : (
          entries.map((entry) => {
            const isMine = entry.user_id === currentUserId
            const isEditing = editingId === entry.id
            const isMenuOpen = openMenuId === entry.id

            return (
              <div 
                key={entry.id} 
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`relative max-w-[85%] p-4 rounded-2xl text-left shadow-sm transition-all
                    ${isMine 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                    }
                  `}
                >
                  {isEditing ? (
                    /* EDIT MODE */
                    <div className="flex flex-col gap-3 min-w-[240px]">
                      <textarea 
                        value={editText} 
                        onChange={e => setEditText(e.target.value)}
                        className="bg-white/10 p-2 rounded border border-white/20 text-inherit outline-none text-base w-full h-24 resize-none focus:bg-white/20"
                      />
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingId(null)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={18}/></button>
                        <button onClick={() => saveEdit(entry.id)} className="p-2 bg-white text-blue-600 rounded-full hover:bg-white/90 shadow-sm"><Check size={18}/></button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <>
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{entry.content}</p>
                      
                      <div className={`flex items-center justify-between mt-2 pt-2 gap-4 ${isMine ? 'border-white/20' : 'border-gray-100'}`}>
                        <span className={`text-[10px] font-medium uppercase tracking-wide ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                          {new Date(entry.created_at).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                          })}
                        </span>
                        
                        {/* MOBILE MENU TRIGGER */}
                        {!readOnly && isMine && (
                          <div className="relative">
                            <button 
                              onClick={() => setOpenMenuId(isMenuOpen ? null : entry.id)}
                              className={`p-1 rounded-full transition-colors ${isMine ? 'hover:bg-blue-500 text-blue-100' : 'hover:bg-gray-100 text-gray-400'}`}
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {/* POPUP MENU */}
                            {isMenuOpen && (
                              <div className="absolute right-0 bottom-8 bg-white text-gray-900 shadow-xl rounded-xl overflow-hidden z-10 min-w-[140px] border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
                                <button 
                                  onClick={() => startEdit(entry)}
                                  className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Edit2 size={14} /> Edit
                                </button>
                                <button 
                                  onClick={() => handleDelete(entry.id)}
                                  className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-50"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Invisible overlay to close menus when clicking outside */}
      {openMenuId !== null && (
        <div 
          className="fixed inset-0 z-0 bg-transparent" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  )
}
