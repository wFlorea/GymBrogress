import { Card } from '@/components/ui/Card'
import { SectionTitle } from '@/components/ui/Page'
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from '@/lib/exercises-data'
import { plural } from '@/lib/format'
import type { MuscleGroupSets } from '@/lib/types'

/** Days the sets are counted over, today included. */
export const VOLUME_DAYS = 7

/** Sets per muscle group over the last week as bars, longest first, and the groups that got none. */
export function MuscleVolume({ groups }: { groups: MuscleGroupSets[] }) {
  const most = Math.max(1, ...groups.map((g) => g.sets))
  const trained = new Set(groups.map((g) => g.group))
  const untrained = MUSCLE_GROUPS.filter((group) => group !== 'cardio' && !trained.has(group))

  return (
    <section className="mb-8">
      <SectionTitle subtitle={`Sets you ticked off in the last ${VOLUME_DAYS} days`}>Sets per muscle group</SectionTitle>
      <Card>
        {groups.length === 0 ? (
          <p className="text-center text-xs text-muted">No sets in the last {VOLUME_DAYS} days.</p>
        ) : (
          <ul className="space-y-3">
            {groups.map(({ group, sets }) => (
              <li key={group}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="font-semibold text-white">{MUSCLE_GROUP_LABELS[group]}</span>
                  <span className="tabular-nums text-muted">{plural(sets, 'set')}</span>
                </div>
                <div
                  className="mt-1.5 h-2 rounded-full bg-primary transition-[width] duration-700 ease-spring"
                  style={{ width: `${(sets / most) * 100}%` }}
                  aria-hidden
                />
              </li>
            ))}
          </ul>
        )}
        {groups.length > 0 && untrained.length > 0 && (
          <p className="mt-4 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-muted">
            Not trained: {untrained.map((group) => MUSCLE_GROUP_LABELS[group]).join(', ')}
          </p>
        )}
      </Card>
    </section>
  )
}
