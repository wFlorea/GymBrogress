'use client'

import { useState, useTransition } from 'react'
import { EXERCISES } from '@/lib/exercises-data'
import { addExerciseSet, updateSet, removeSet } from './actions'
import { Check, Trash2, Plus } from 'lucide-react'

type SetData = {
  id: string
  exercise_id: string
  exercise_name: string
  set_number: number
  actual_reps: number
  actual_weight: number
  is_completed: boolean
}

export function TrackerClient({ logId, initialSets }: { logId: string, initialSets: SetData[] }) {
  const [sets, setSets] = useState<SetData[]>(initialSets)
  const [isPending, startTransition] = useTransition()
  const [showExerciseSelect, setShowExerciseSelect] = useState(false)

  // Group sets by exercise
  const groupedSets = sets.reduce((acc, set) => {
    if (!acc[set.exercise_id]) {
      acc[set.exercise_id] = { name: set.exercise_name, sets: [] }
    }
    acc[set.exercise_id].sets.push(set)
    return acc
  }, {} as Record<string, { name: string, sets: SetData[] }>)

  const handleAddExercise = (exerciseId: string, exerciseName: string) => {
    setShowExerciseSelect(false)
    startTransition(() => {
      addExerciseSet(logId, exerciseId, exerciseName)
    })
  }

  const handleAddSet = (exerciseId: string, exerciseName: string) => {
    startTransition(() => {
      addExerciseSet(logId, exerciseId, exerciseName)
    })
  }

  const handleUpdateSet = (setId: string, field: 'actual_reps' | 'actual_weight', value: string) => {
    const numValue = parseInt(value) || 0
    
    // Optimistic UI update
    setSets(sets.map(s => s.id === setId ? { ...s, [field]: numValue } : s))
    
    // DB update
    startTransition(() => {
      updateSet(setId, { [field]: numValue })
    })
  }

  const handleToggleComplete = (setId: string, isCompleted: boolean) => {
    // Optimistic UI update
    setSets(sets.map(s => s.id === setId ? { ...s, is_completed: !isCompleted } : s))
    
    // DB update
    startTransition(() => {
      updateSet(setId, { is_completed: !isCompleted })
    })
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedSets).map(([exerciseId, data]) => (
        <div key={exerciseId} className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
          <h3 className="font-bold text-lg mb-4 text-[var(--color-primary)]">{data.name}</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[var(--color-muted)] px-2">
              <div className="col-span-2 text-center">SET</div>
              <div className="col-span-3 text-center">KG</div>
              <div className="col-span-3 text-center">REPS</div>
              <div className="col-span-4 text-center">DONE</div>
            </div>

            {data.sets.sort((a, b) => a.set_number - b.set_number).map((set) => (
              <div key={set.id} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg ${set.is_completed ? 'bg-[var(--color-success)]/10' : 'bg-[#1a1a1a]'}`}>
                <div className="col-span-2 text-center font-bold text-[var(--color-muted)]">
                  {set.set_number}
                </div>
                <div className="col-span-3">
                  <input 
                    type="number" 
                    value={set.actual_weight || ''}
                    onChange={(e) => handleUpdateSet(set.id, 'actual_weight', e.target.value)}
                    className="w-full bg-transparent border-b border-[var(--color-border)] text-center focus:outline-none focus:border-[var(--color-primary)]"
                    placeholder="0"
                  />
                </div>
                <div className="col-span-3">
                  <input 
                    type="number" 
                    value={set.actual_reps || ''}
                    onChange={(e) => handleUpdateSet(set.id, 'actual_reps', e.target.value)}
                    className="w-full bg-transparent border-b border-[var(--color-border)] text-center focus:outline-none focus:border-[var(--color-primary)]"
                    placeholder="0"
                  />
                </div>
                <div className="col-span-4 flex justify-center gap-2">
                  <button 
                    onClick={() => handleToggleComplete(set.id, set.is_completed)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${set.is_completed ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-surface-hover)] text-[var(--color-muted)]'}`}
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => {
                       startTransition(() => removeSet(set.id))
                    }}
                    className="w-8 h-8 rounded-md flex items-center justify-center bg-red-900/30 text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => handleAddSet(exerciseId, data.name)}
            className="w-full mt-4 py-2 text-sm font-semibold text-[var(--color-muted)] hover:text-white transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={16} /> Adaugă Set
          </button>
        </div>
      ))}

      {!showExerciseSelect ? (
        <button 
          onClick={() => setShowExerciseSelect(true)}
          className="w-full bg-[var(--color-primary)] text-white font-bold py-4 rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#FF4500]/20"
        >
          <Plus size={20} /> Adaugă Exercițiu
        </button>
      ) : (
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Selectează Exercițiul</h3>
            <button onClick={() => setShowExerciseSelect(false)} className="text-[var(--color-muted)] text-sm">Închide</button>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
            {EXERCISES.map(ex => (
              <button 
                key={ex.id}
                onClick={() => handleAddExercise(ex.id, ex.name)}
                className="w-full text-left p-3 rounded-lg hover:bg-[var(--color-surface-hover)] border border-transparent hover:border-[var(--color-border)] transition-colors"
              >
                <div className="font-semibold">{ex.name}</div>
                <div className="text-xs text-[var(--color-muted)] capitalize">{ex.muscle_group}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
