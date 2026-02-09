'use client'

import { useState, useEffect, useRef } from 'react'
import { saveDailyGratitude, getEntriesByDate } from '@/app/journal/actions'
import { ChevronLeft, ChevronRight, Edit2, Heart, Loader2, User, Save, X } from 'lucide-react'
import { format, addDays, isFuture, isSameDay } from 'date-fns'
import Image from 'next/image'

// --- CONSTANTS ---
const PLACEHOLDERS = [
  "My partner made coffee this morning before I even woke up.",
  "My dad sent me a meme that made me laugh out loud.",
  "My dog was uncontrollably happy to see me when I walked in the door.",
  "Had a 20-minute phone call with an old friend I haven't seen in years.",
  "My toddler actually ate their vegetables without a negotiation process.",
  "My grandmother told me a story about her childhood I'd never heard before.",
  "A stranger held the elevator door for me when I was running late.",
  "The meeting that could have been an email... was actually just an email.",
  "I successfully plugged the USB drive in on the first try.",
  "I parallel parked perfectly on the first attempt and someone saw it.",
  "Found a crisp $20 bill in a winter coat I haven't worn since last year.",
  "Managed to keep my white shirt clean while eating spaghetti.",
  "My cat decided to sit on my lap instead of my keyboard for once.",
  "I woke up thinking it was Wednesday, but it was actually Friday.",
  "The avocado I opened for breakfast was perfectly ripe.",
  "I finally finished that book I’ve been reading for two months.",
  "Caught all the green lights on my drive home from work.",
  "The barista remembered my name and my order.",
  "It was sunny during my lunch break so I got to eat outside.",
  "I remembered to cancel that free trial before they charged me.",
  "Slept in for an extra 30 minutes without feeling guilty about it."
]

type Entry = {
  id: number
  content: string
  user_id: string
  entry_date: string
}

export default function GratitudeJournal({ 
  initialEntries, 
  currentUserId,
  partnerName,
  relationshipId,
  readOnly = false,
  initialDate,
  currentUserAvatar,
  partnerAvatar
}: { 
  initialEntries: Entry[], 
  currentUserId: string,
  partnerName: string,
  relationshipId: string,
  readOnly?: boolean,
  initialDate?: string,
  currentUserAvatar?: string | null,
  partnerAvatar?: string | null
}) {
  // 1. Initialize Date
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialDate) {
      const [y, m, d] = initialDate.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    return new Date()
  })
  
  const [entries, setEntries] = useState<Entry[]>(initialEntries)

  useEffect(() => {
    setEntries(initialEntries)
  }, [initialEntries])
  
  // Filter entries
  const myEntries = entries.filter(e => e.user_id === currentUserId)
  const partnerEntries = entries.filter(e => e.user_id !== currentUserId)
  const isToday = isSameDay(currentDate, new Date())
  
  // 2. Edit State
  const [isEditing, setIsEditing] = useState(() => {
    if (readOnly) return false
    return myEntries.length === 0
  })
  
  // 3. Input State
  const [inputs, setInputs] = useState<string[]>(() => {
    if (myEntries.length > 0) {
      const texts = myEntries.map(e => e.content)
      while (texts.length < 3) texts.push('')
      if (texts[texts.length - 1] !== '') texts.push('')
      return texts
    }
    return ['', '', '']
  })

  // 4. Random Placeholders State
  const [currentPlaceholders, setCurrentPlaceholders] = useState<string[]>([])

  // Initialize random placeholders on mount
  useEffect(() => {
    const shuffled = [...PLACEHOLDERS].sort(() => 0.5 - Math.random())
    setCurrentPlaceholders(shuffled.slice(0, 3))
  }, []) 

  const [initialInputs, setInitialInputs] = useState<string[]>(inputs)
  const [loading, setLoading] = useState(false)
  const [showCongrats, setShowCongrats] = useState(false)

  // --- HELPERS ---

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs]
    newInputs[index] = value
    // Auto-add new line if last one is filled
    if (index === newInputs.length - 1 && value.trim() !== '') {
      newInputs.push('')
    }
    setInputs(newInputs)
  }

  // Auto-resize textarea function
  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto'; // Reset height
    e.target.style.height = `${e.target.scrollHeight}px`; // Set to scroll height
  }

  const handleBlur = () => {
    let cleaned = inputs.filter((txt, i) => i < 3 || txt.trim() !== '' || i === inputs.length - 1)
    while (cleaned.length < 3) cleaned.push('')
    if (cleaned[cleaned.length - 1].trim() !== '') cleaned.push('')
    setInputs(cleaned)
  }

  const resetForDate = (data: Entry[], date: Date) => {
    const mine = data.filter(e => e.user_id === currentUserId)
    const texts = mine.map(e => e.content)
    const hasData = mine.length > 0
    
    // Logic: Never edit in ReadOnly mode
    const shouldEdit = !readOnly && isSameDay(date, new Date()) && !hasData

    setIsEditing(shouldEdit)

    const newInputs = [...texts]
    while (newInputs.length < 3) newInputs.push('')
    if (newInputs[newInputs.length - 1] !== '') newInputs.push('')
    
    setInputs(newInputs)
    setInitialInputs(newInputs)

    // Re-shuffle placeholders if we are entering edit mode
    if (shouldEdit) {
      const shuffled = [...PLACEHOLDERS].sort(() => 0.5 - Math.random())
      setCurrentPlaceholders(shuffled.slice(0, 3))
    }
  }

  // --- ACTIONS ---

  const handleSave = async () => {
    if (readOnly) return
    setLoading(true)
    const validInputs = inputs.filter(t => t.trim() !== '')
    const formattedDate = format(currentDate, 'yyyy-MM-dd')
    
    const result = await saveDailyGratitude(validInputs, formattedDate)
    
    if (result.success) {
      const freshData = await getEntriesByDate(relationshipId, formattedDate)
      setEntries(freshData)
      setIsEditing(false)
      resetForDate(freshData, currentDate)
      if (isToday) setShowCongrats(true)
    }
    setLoading(false)
  }

  const changeDate = async (days: number) => {
    const newDate = addDays(currentDate, days)
    if (isFuture(newDate)) return 

    if (isEditing) {
      const isDirty = JSON.stringify(inputs) !== JSON.stringify(initialInputs)
      if (isDirty && !confirm("You have unsaved changes. Discard them?")) return
    }

    setLoading(true)
    setCurrentDate(newDate)
    
    const newDateStr = format(newDate, 'yyyy-MM-dd')
    const data = await getEntriesByDate(relationshipId, newDateStr)
    
    setEntries(data)
    resetForDate(data, newDate)
    setLoading(false)
  }

  // --- UI HELPER: Avatar Renderer ---
  const renderAvatar = (url: string | null | undefined, fallbackColor: string) => {
    if (url) {
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm relative shrink-0">
           <Image src={url} alt="Avatar" fill className="object-cover" />
        </div>
      )
    }
    return (
      <div className={`w-10 h-10 rounded-full ${fallbackColor} flex items-center justify-center shadow-sm border-2 border-white shrink-0`}>
        <User size={18} className="opacity-60" />
      </div>
    )
  }

  // --- CONGRATS MODAL ---
  if (showCongrats) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
        <div className="bg-green-100 p-8 rounded-full mb-8">
          <Heart className="w-16 h-16 text-green-600 fill-green-600 animate-pulse" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Wonderful!</h2>
        <p className="text-gray-500 text-center max-w-xs mb-10 text-lg leading-relaxed">
          Gratitude turns what we have into enough.
        </p>
        <button 
          onClick={() => setShowCongrats(false)}
          className="bg-gray-900 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform"
        >
          See Journal
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto pb-24">
      
      {/* HEADER: Date Navigation */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md pt-4 pb-4 mb-6 border-b border-gray-100">
        <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-2xl mx-2">
          <button 
            onClick={() => changeDate(-1)}
            disabled={loading}
            className="p-3 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {isToday ? 'Today' : format(currentDate, 'EEEE')}
            </span>
            <span className="text-sm font-bold text-gray-900">
              {format(currentDate, 'MMMM d, yyyy')}
            </span>
          </div>

          <button 
            onClick={() => changeDate(1)}
            disabled={isFuture(addDays(currentDate, 1)) || loading}
            className="p-3 text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-0"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- MY SECTION --- */}
        <section>
          {/* Profile Header */}
          <div className="flex justify-between items-center mb-3 px-2">
            <div className="flex items-center gap-3">
              {renderAvatar(currentUserAvatar, "bg-blue-100 text-blue-600")}
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">You</h3>
            </div>

            {/* Edit Button */}
            {!isEditing && !readOnly && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm"
              >
                <Edit2 size={12} /> Edit
              </button>
            )}
          </div>

          <div className={`
            rounded-3xl transition-all duration-300
            ${isEditing ? 'bg-white shadow-xl ring-4 ring-blue-50 p-6' : 'bg-white border border-gray-100 p-6 shadow-sm'}
          `}>
            {isEditing ? (
              /* --- EDIT MODE --- */
              <div className="space-y-6">
                 
                 {/* THE QUESTION (Updated Font) */}
                 <div className="border-b border-gray-100 pb-4 mb-4">
                    <h2 className="text-xl font-bold text-gray-900 leading-relaxed">
                      What are three things about today you&apos;re grateful for?
                    </h2>
                 </div>

                 {/* INPUTS */}
                 {inputs.map((text, i) => (
                    <div key={i} className="relative">
                       {/* Number Badge */}
                       <span className="absolute left-4 top-4 w-6 h-6 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold select-none z-10">
                         {i + 1}
                       </span>
                       
                       {/* Multi-line Textarea (Auto-resize & No Handle) */}
                       <textarea
                        value={text}
                        onChange={(e) => {
                          handleInputChange(i, e.target.value);
                          adjustTextareaHeight(e); // Auto-grow
                        }}
                        onFocus={(e) => adjustTextareaHeight(e)} // Ensure height is correct on focus
                        onBlur={handleBlur}
                        placeholder={currentPlaceholders[i % currentPlaceholders.length] || "Something small..."} 
                        className="w-full pl-12 pr-4 py-4 min-h-[5.5rem] bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-800 placeholder:text-gray-400 placeholder:font-normal resize-none overflow-hidden text-base leading-relaxed"
                        autoFocus={i === 0 && text === ''}
                      />
                    </div>
                  ))}

                 {/* ACTION BUTTONS */}
                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setIsEditing(false); setInputs(initialInputs) }} 
                      className="flex-1 py-4 text-gray-500 font-bold text-sm bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <X size={16} /> Cancel
                    </button>
                    <button 
                      onClick={handleSave} 
                      disabled={loading || inputs.filter(i => i.trim()).length === 0} 
                      className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <><Save size={16} /> Save Journal</>}
                    </button>
                 </div>
              </div>
            ) : (
              /* --- VIEW MODE --- */
              <ul className="space-y-4">
                {myEntries.length > 0 ? (
                  myEntries.map((entry, i) => (
                    <li key={entry.id} className="flex gap-4 items-start group">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{entry.content}</span>
                    </li>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 italic mb-4">You haven&apos;t written anything yet.</p>
                  </div>
                )}
              </ul>
            )}
          </div>
        </section>

        {/* --- PARTNER SECTION --- */}
        <section>
          <div className="mb-3 px-2 flex items-center gap-3">
             {renderAvatar(partnerAvatar, "bg-pink-100 text-pink-600")}
             <h3 className="text-sm font-bold text-pink-500 uppercase tracking-wider">{partnerName}</h3>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
            {partnerEntries.length > 0 ? (
              <ul className="space-y-4">
                {partnerEntries.map((entry, i) => (
                  <li key={entry.id} className="flex gap-4 items-start">
                     <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                    <span className="text-gray-700 leading-relaxed">{entry.content}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 opacity-60">
                 <p className="text-gray-400 italic text-sm">{partnerName} hasn't written anything.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
