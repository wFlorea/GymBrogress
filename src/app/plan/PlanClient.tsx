'use client'

import { useState, useTransition } from 'react'
import {
  SPLIT_OPTIONS,
  PlannedExerciseItem,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_EMOJIS,
  MuscleGroup,
  RoutineTemplatesMap,
} from '@/lib/types'
import { EXERCISES } from '@/lib/exercises-data'
import { addExerciseToSplitTemplate, removeExerciseFromSplitTemplate } from './actions'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  Search,
  X,
  Dumbbell,
  ArrowRight,
  Check,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react'

export function PlanClient({
  initialTemplates,
}: {
  initialTemplates: RoutineTemplatesMap
}) {
  const [templates, setTemplates] = useState<RoutineTemplatesMap>(initialTemplates)
  const [activeModalSplitKey, setActiveModalSplitKey] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<'recommended' | 'all' | MuscleGroup>('recommended')
  const [activeSplitTab, setActiveSplitTab] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  // Eligible splits to display in templates (exclude "Rest Day" since it has no exercises)
  const splitsToDisplay = SPLIT_OPTIONS.filter((s) => s.id !== 'Rest Day')

  const handleAddExercise = (
    splitKey: string,
    ex: { id: string; name: string; muscle_group: MuscleGroup }
  ) => {
    const newItem: PlannedExerciseItem = {
      id: ex.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
    }

    const currentList = templates[splitKey] || []
    if (currentList.some((e) => e.id === ex.id)) return

    const updatedList = [...currentList, newItem]
    setTemplates({
      ...templates,
      [splitKey]: updatedList,
    })

    startTransition(async () => {
      try {
        await addExerciseToSplitTemplate(splitKey, newItem)
      } catch (err) {
        console.error(err)
      }
    })
  }

  const handleRemoveExercise = (splitKey: string, exerciseId: string) => {
    const currentList = templates[splitKey] || []
    const updatedList = currentList.filter((e) => e.id !== exerciseId)

    setTemplates({
      ...templates,
      [splitKey]: updatedList,
    })

    startTransition(async () => {
      try {
        await removeExerciseFromSplitTemplate(splitKey, exerciseId)
      } catch (err) {
        console.error(err)
      }
    })
  }

  // Active modal details
  const activeSplitConfig = SPLIT_OPTIONS.find((s) => s.id === activeModalSplitKey)
  const activeSplitExercises = activeModalSplitKey ? templates[activeModalSplitKey] || [] : []

  // Filter exercises in modal
  const filteredExercises = EXERCISES.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.description.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false

    if (selectedMuscleFilter === 'all') return true
    if (selectedMuscleFilter === 'recommended') {
      if (!activeSplitConfig || activeSplitConfig.targetMuscleGroups.length === 0) return true
      return activeSplitConfig.targetMuscleGroups.includes(ex.muscle_group)
    }
    return ex.muscle_group === selectedMuscleFilter
  })

  // Visible splits based on top pill selector
  const visibleSplits = activeSplitTab === 'all' 
    ? splitsToDisplay 
    : splitsToDisplay.filter((s) => s.id === activeSplitTab)

  return (
    <div className="space-y-6">
      {/* Informative Banner */}
      <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-md flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FF4500]/15 flex items-center justify-center text-[var(--color-primary)] shrink-0 mt-0.5">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="font-bold text-sm text-white">Rutine Generale de Antrenament</h2>
          <p className="text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
            Configurează exercițiile dorite pentru fiecare tip de sesiune (Push, Pull, Legs etc.). Când îți muți zilele în <strong>Schedule</strong> sau <strong>Calendar</strong>, planul se preia automat, fără să adaugi fiecare exercițiu din nou!
          </p>
        </div>
      </div>

      {/* Quick Split Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setActiveSplitTab('all')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
            activeSplitTab === 'all'
              ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[#FF4500]/20'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Toate Rutinele ({splitsToDisplay.length})
        </button>
        {splitsToDisplay.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSplitTab(s.id)}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeSplitTab === s.id
                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[#FF4500]/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <span>{s.emoji}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Master Split Routines List */}
      <div className="space-y-4">
        {visibleSplits.map((splitConfig) => {
          const splitKey = splitConfig.id
          const exercises = templates[splitKey] || []

          return (
            <div
              key={splitKey}
              className="rounded-2xl border bg-[var(--color-surface)] border-[#FF4500]/25 overflow-hidden shadow-sm transition-all"
            >
              {/* Card Header */}
              <div className="p-4 flex items-center justify-between border-b border-[var(--color-border)]/60 bg-gradient-to-r from-[var(--color-surface)] to-[#18181c]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{splitConfig.emoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-white">{splitConfig.name}</h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF4500]/15 text-[var(--color-primary)]">
                        {splitConfig.id}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">{splitConfig.description}</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-zinc-300 bg-zinc-800/90 border border-zinc-700 px-2.5 py-1 rounded-xl shrink-0">
                  {exercises.length} {exercises.length === 1 ? 'exercițiu' : 'exerciții'}
                </span>
              </div>

              {/* Card Body: Exercise List */}
              <div className="p-4 space-y-2.5">
                {exercises.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl">
                    <Dumbbell size={24} className="mx-auto text-[var(--color-muted)] mb-2" />
                    <p className="text-xs text-[var(--color-muted)]">
                      Nu ai adăugat încă niciun exercițiu pentru {splitConfig.name}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exercises.map((item, idx) => (
                      <div
                        key={item.id + '-' + idx}
                        className="bg-[#151515] p-3 rounded-xl border border-[var(--color-border)]/80 flex items-center justify-between hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-[var(--color-muted)] shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h5 className="font-bold text-sm text-white">{item.name}</h5>
                            <span className="text-[10px] text-[var(--color-muted)] flex items-center gap-1">
                              {MUSCLE_GROUP_EMOJIS[item.muscle_group || 'chest']}{' '}
                              {MUSCLE_GROUP_LABELS[item.muscle_group || 'chest']}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(splitKey, item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors shrink-0"
                          title="Șterge exercițiul"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Exercise Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalSplitKey(splitKey)
                    setSearchTerm('')
                    setSelectedMuscleFilter('recommended')
                  }}
                  className="w-full mt-2 py-3 border border-dashed border-[#FF4500]/40 text-[var(--color-primary)] font-bold text-xs rounded-xl hover:bg-[#FF4500]/10 transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]"
                >
                  <Plus size={16} /> Adaugă Exercițiu în {splitConfig.name}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action links */}
      <div className="pt-2 grid grid-cols-2 gap-3">
        <Link
          href="/schedule"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs text-center"
        >
          <Calendar size={15} className="text-[var(--color-primary)]" />
          <span>Alege Zilele în Schedule</span>
        </Link>
        <Link
          href="/calendar"
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs text-center shadow-lg shadow-[#FF4500]/25"
        >
          <Layers size={15} />
          <span>Planifică Luna în Calendar</span>
        </Link>
      </div>

      {/* Exercise Picker Modal */}
      {activeModalSplitKey !== null && activeSplitConfig && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl p-5 max-h-[88vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold flex items-center gap-1">
                  <span>{activeSplitConfig.emoji}</span>
                  <span>{activeSplitConfig.name}</span>
                </span>
                <h3 className="text-xl font-extrabold text-white">Adaugă în Rutină</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalSplitKey(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative my-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Caută exercițiu (ex: Bench Press, Squat, Ramat)..."
                className="w-full rounded-xl pl-10 pr-4 py-2.5 bg-[#141414] border border-[var(--color-border)] text-white text-xs placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setSelectedMuscleFilter('recommended')}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedMuscleFilter === 'recommended'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles size={12} /> Recomandate
              </button>
              <button
                type="button"
                onClick={() => setSelectedMuscleFilter('all')}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                  selectedMuscleFilter === 'all'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Toate ({EXERCISES.length})
              </button>
              {(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'] as MuscleGroup[]).map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => setSelectedMuscleFilter(mg)}
                  className={`px-2.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedMuscleFilter === mg
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{MUSCLE_GROUP_EMOJIS[mg]}</span>
                  <span>{MUSCLE_GROUP_LABELS[mg]}</span>
                </button>
              ))}
            </div>

            {/* Exercises List */}
            <div className="overflow-y-auto py-2 space-y-2 pr-1 flex-1">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-10 text-[var(--color-muted)] text-xs">
                  Nu a fost găsit niciun exercițiu pentru criteriile alese.
                </div>
              ) : (
                filteredExercises.map((ex) => {
                  const isAlreadyAdded = activeSplitExercises.some((e) => e.id === ex.id)

                  return (
                    <div
                      key={ex.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isAlreadyAdded
                          ? 'bg-[#182318] border-emerald-800/60 opacity-80'
                          : 'bg-[#181818] border-[var(--color-border)] hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{ex.name}</h4>
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                            {MUSCLE_GROUP_LABELS[ex.muscle_group]}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-muted)] mt-1 line-clamp-1">
                          {ex.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddExercise(activeModalSplitKey, ex)}
                        disabled={isAlreadyAdded}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                          isAlreadyAdded
                            ? 'bg-emerald-900/40 text-emerald-400 cursor-default'
                            : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-95 shadow-md shadow-[#FF4500]/20'
                        }`}
                        title={isAlreadyAdded ? 'Deja adăugat' : 'Adaugă exercițiu'}
                      >
                        {isAlreadyAdded ? <Check size={18} strokeWidth={3} /> : <Plus size={18} />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
