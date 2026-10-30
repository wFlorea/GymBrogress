import { describe, expect, it, vi } from 'vitest'
import type { WorkoutSet } from '@/lib/types'
import { applyChanges, type SetChange } from './outbox'

// The server actions aren't called by applyChanges.
vi.mock('./actions', () => ({ addSet: vi.fn(), updateSet: vi.fn(), removeSet: vi.fn() }))

const bench: WorkoutSet = {
  id: 'set-1',
  exercise_id: 'ex-001',
  exercise_name: 'Bench Press',
  set_number: 1,
  actual_reps: 10,
  actual_weight: 60,
  is_completed: true,
}

const create: SetChange = {
  kind: 'create',
  logId: 'log-1',
  setId: 'set-2',
  exerciseId: 'ex-001',
  values: { actual_reps: 8, actual_weight: 62.5 },
}

describe('applyChanges', () => {
  it('adds a created set after the last one of its exercise', () => {
    const [, added] = applyChanges([bench], [create])
    expect(added).toMatchObject({ id: 'set-2', set_number: 2, actual_reps: 8, actual_weight: 62.5, is_completed: false })
    expect(added.exercise_name).not.toBe('')
  })

  it('patches and deletes sets', () => {
    expect(applyChanges([bench], [{ kind: 'update', logId: 'log-1', setId: 'set-1', patch: { actual_reps: 12 } }])).toEqual([
      { ...bench, actual_reps: 12 },
    ])
    expect(applyChanges([bench], [{ kind: 'delete', logId: 'log-1', setId: 'set-1' }])).toEqual([])
  })

  it('leaves other sets alone', () => {
    expect(applyChanges([bench], [{ kind: 'update', logId: 'log-1', setId: 'set-9', patch: { actual_reps: 12 } }])).toEqual([
      bench,
    ])
  })

  it('changes nothing more when applied twice', () => {
    const changes: SetChange[] = [create, { kind: 'update', logId: 'log-1', setId: 'set-2', patch: { is_completed: true } }]
    const once = applyChanges([bench], changes)
    expect(applyChanges(once, changes)).toEqual(once)
  })
})
