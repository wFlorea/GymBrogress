'use client'

import { useState, useTransition } from 'react'
import { DAYS_OF_WEEK } from '@/lib/types'
import { upsertWeeklyPlan } from './actions'

type Plan = {
  id: string
  day_of_week: number
  workout_name: string
}

export function PlannerClient({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleEdit = (dayIndex: number, currentName: string) => {
    setEditingDay(dayIndex)
    setEditValue(currentName)
  }

  const handleSave = async (dayIndex: number) => {
    const newName = editValue.trim()
    
    // Optimistic update
    const existingPlanIndex = plans.findIndex(p => p.day_of_week === dayIndex)
    const newPlans = [...plans]
    
    if (existingPlanIndex >= 0) {
      newPlans[existingPlanIndex] = { ...newPlans[existingPlanIndex], workout_name: newName }
    } else {
      newPlans.push({ id: 'temp', day_of_week: dayIndex, workout_name: newName })
    }
    
    setPlans(newPlans)
    setEditingDay(null)

    // Server action
    if (newName) {
      startTransition(async () => {
        try {
          await upsertWeeklyPlan(dayIndex, newName)
        } catch (error) {
          console.error(error)
          // Revert on error could be implemented here
        }
      })
    }
  }

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map((day, index) => {
        const plan = plans.find((p) => p.day_of_week === index)
        const workoutName = plan?.workout_name || ''
        const isEditing = editingDay === index
        const isRestDay = workoutName.toLowerCase().includes('rest') || workoutName === ''

        return (
          <div 
            key={day} 
            className={`p-4 rounded-xl border flex flex-col justify-center transition-colors ${
              isRestDay 
                ? 'bg-[var(--color-surface)] border-[var(--color-border)] opacity-70' 
                : 'bg-[#2a1c15] border-[#FF4500]/30'
            }`}
            onClick={() => !isEditing && handleEdit(index, workoutName)}
          >
            <div className="flex justify-between items-center h-8">
              <span className="font-bold w-24">{day}</span>
              
              {isEditing ? (
                <div className="flex-1 flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSave(index)
                      if (e.key === 'Escape') setEditingDay(null)
                    }}
                    onBlur={() => handleSave(index)}
                    className="flex-1 bg-[#121212] border border-[var(--color-border)] rounded px-2 py-1 text-sm focus:outline-none focus:border-[var(--color-primary)] text-white"
                    placeholder="ex: Chest Day, Rest"
                  />
                </div>
              ) : (
                <div className="flex-1 text-right">
                  {workoutName ? (
                    <span className="text-sm font-medium text-[var(--color-primary)]">
                      {workoutName}
                    </span>
                  ) : (
                    <span className="text-[var(--color-muted)] text-sm italic">
                      + Adaugă Antrenament
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
      {isPending && <p className="text-center text-xs text-[var(--color-muted)]">Se salvează...</p>}
    </div>
  )
}
