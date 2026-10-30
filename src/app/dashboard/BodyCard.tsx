'use client'

import { useState } from 'react'
import { Activity, Pencil, Target } from 'lucide-react'
import { GoalsForm } from '@/components/GoalsForm'
import { Card, StatItem } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { buttonStyles } from '@/components/ui/styles'
import { ACTIVITY_LEVELS, BMI_CATEGORIES, SEXES, bmiCategory, bmiOf, goalWeightText } from '@/lib/body'
import { formatKcal, formatWeight } from '@/lib/format'
import { WEIGHT_PLANS } from '@/lib/nutrition'
import type { BodyStats, NutritionGoals, PlanPace, WeightPlan, WeightUnit } from '@/lib/types'
import { BodyForm } from './BodyForm'

/** The BMI range the scale shows; values outside it sit at its ends. */
const SCALE_MIN = 15
const SCALE_MAX = 35

const scalePercent = (bmi: number) =>
  ((Math.min(Math.max(bmi, SCALE_MIN), SCALE_MAX) - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100

/** The BMI from the user's weight and height, their other stats, and their goal; edits both in sheets. */
export function BodyCard({
  body,
  goalWeight,
  goals,
  weightPlan,
  planPace,
  unit,
}: {
  body: BodyStats
  goalWeight: number | null
  goals: NutritionGoals
  weightPlan: WeightPlan
  planPace: PlanPace
  unit: WeightUnit
}) {
  const [sheet, setSheet] = useState<'body' | 'goals' | null>(null)
  // Bumped on every open, so the forms start fresh.
  const [formKey, setFormKey] = useState(0)

  const bmi = body.weight !== null && body.height !== null ? bmiOf(body.weight, body.height) : null
  const hasStats = Object.values(body).some((value) => value !== null)
  const sex = SEXES.find((option) => option.key === body.sex)
  const activity = ACTIVITY_LEVELS.find((level) => level.key === body.activity)
  const hasGoal = goalWeight !== null || goals.calories !== null
  const goalDetails = [
    body.weight !== null && goalWeight !== null && goalWeightText(body.weight, goalWeight, unit),
    weightPlan !== 'maintain' && `${WEIGHT_PLANS.find((plan) => plan.key === weightPlan)?.label.toLowerCase()} ${planPace}%`,
    goals.calories !== null && `${formatKcal(goals.calories)} a day`,
  ].filter(Boolean)

  function open(next: 'body' | 'goals') {
    setFormKey((key) => key + 1)
    setSheet(next)
  }

  return (
    <>
      <Card className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold">BMI</h2>
            <p className="text-xs text-muted">{bmi === null ? 'Add your weight and height to see it' : bmiCategory(bmi).label}</p>
          </div>
          <button type="button" onClick={() => open('body')} className={`${buttonStyles.chip} shrink-0 whitespace-nowrap`}>
            <Pencil size={13} /> {hasStats ? 'Edit' : 'Add details'}
          </button>
        </div>

        {bmi !== null && (
          <>
            <p className="mt-4 font-display text-[2.5rem] font-bold leading-none tabular-nums">{bmi.toFixed(1)}</p>
            <BmiScale bmi={bmi} />
          </>
        )}

        <dl className="mt-5 grid grid-cols-4 gap-1 border-t border-white/5 pt-4 text-center">
          <StatItem value={body.weight === null ? '–' : formatWeight(body.weight, unit)} label="Weight" className="text-lg" />
          <StatItem value={body.height === null ? '–' : `${body.height} cm`} label="Height" className="text-lg" />
          <StatItem value={body.age ?? '–'} label="Age" className="text-lg" />
          <StatItem value={body.bodyFat === null ? '–' : `${body.bodyFat}%`} label="Body fat" className="text-lg" />
        </dl>
        {(sex || activity) && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Activity size={13} className="text-primary" />{' '}
            {[sex?.label, activity && `${activity.label}: ${activity.description.toLowerCase()}`].filter(Boolean).join(' · ')}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-sunken p-3.5">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">Goal</p>
            <p className="font-semibold">{goalWeight === null ? 'No goal weight yet' : formatWeight(goalWeight, unit)}</p>
            <p className="text-[11px] text-muted">
              {goalDetails.length > 0 ? goalDetails.join(', ') : 'Pick the weight you want and your daily calories.'}
            </p>
          </div>
          <button type="button" onClick={() => open('goals')} className={`${buttonStyles.soft} shrink-0 px-4 py-2.5 text-xs`}>
            <Target size={14} /> {hasGoal ? 'Goal' : 'Set goal'}
          </button>
        </div>
      </Card>

      <Modal open={sheet === 'body'} onClose={() => setSheet(null)} title="Your details">
        <BodyForm key={formKey} body={body} weightPlan={weightPlan} planPace={planPace} unit={unit} onSaved={() => setSheet(null)} />
      </Modal>
      <Modal open={sheet === 'goals'} onClose={() => setSheet(null)} title="Your goals">
        <GoalsForm
          key={formKey}
          body={body}
          goalWeight={goalWeight}
          goals={goals}
          weightPlan={weightPlan}
          planPace={planPace}
          unit={unit}
          onSaved={() => setSheet(null)}
          onAddDetails={() => open('body')}
        />
      </Modal>
    </>
  )
}

/** Where the BMI sits across the four ranges, with the user's range lit up. The number above says the same. */
function BmiScale({ bmi }: { bmi: number }) {
  const current = bmiCategory(bmi)

  return (
    <div className="mt-4" aria-hidden>
      <div className="relative">
        <div className="flex gap-0.5">
          {BMI_CATEGORIES.map((category, i) => {
            const from = i === 0 ? SCALE_MIN : BMI_CATEGORIES[i - 1].below
            const to = Math.min(category.below, SCALE_MAX)
            return (
              <span
                key={category.label}
                style={{ flexGrow: to - from }}
                className={`h-1.5 basis-0 rounded-full ${category === current ? 'bg-primary' : 'bg-white/10'}`}
              />
            )
          })}
        </div>
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-white"
          style={{ left: `${scalePercent(bmi)}%` }}
        />
      </div>
      <div className="relative mt-2 h-3 text-[10px] text-muted">
        {BMI_CATEGORIES.slice(0, -1).map(({ below }) => (
          <span key={below} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${scalePercent(below)}%` }}>
            {below}
          </span>
        ))}
      </div>
    </div>
  )
}
