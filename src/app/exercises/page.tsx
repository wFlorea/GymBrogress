import { EXERCISES } from '@/lib/exercises-data'
import { MUSCLE_GROUP_EMOJIS, MUSCLE_GROUP_LABELS } from '@/lib/types'

export default function ExercisesPage() {
  return (
    <div className="p-4 pt-8 pb-20">
      <h1 className="text-2xl font-bold mb-6">Bibliotecă Video</h1>
      
      <div className="grid gap-4">
        {EXERCISES.map((ex) => (
          <div key={ex.id} className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{ex.name}</h3>
              <span className="text-xs bg-[#121212] px-2 py-1 rounded text-[var(--color-primary)]">
                {MUSCLE_GROUP_EMOJIS[ex.muscle_group]} {MUSCLE_GROUP_LABELS[ex.muscle_group]}
              </span>
            </div>
            <p className="text-sm text-[var(--color-muted)] mb-3">{ex.description}</p>
            
            <div className="bg-[#121212] h-32 rounded-lg flex items-center justify-center border border-dashed border-[var(--color-border)]">
              {ex.video_url ? (
                <span className="text-[var(--color-success)]">Video Disponibil</span>
              ) : (
                <span className="text-[var(--color-muted)] text-sm flex flex-col items-center">
                  <span className="text-2xl mb-1">🎥</span>
                  Working on it...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
