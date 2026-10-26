'use client'

import { createContext, useContext, useId, type ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

type Sortable = ReturnType<typeof useSortable>
type DragHandleBinding = Pick<Sortable, 'attributes' | 'listeners'> & { attach: Sortable['setActivatorNodeRef'] }

const DragHandleContext = createContext<DragHandleBinding | null>(null)

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 })

/**
 * A vertical list whose items are dragged up and down by their handle (mouse, touch or keyboard).
 * `onReorder` gets the ids in their new order once an item is dropped somewhere else.
 */
export function SortableList<T extends string>({
  ids,
  itemName,
  onReorder,
  children,
}: {
  ids: T[]
  /** Name read out to screen readers while an item is moved. */
  itemName: (id: T) => string
  onReorder: (ids: T[]) => void
  children: ReactNode
}) {
  const id = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const name = (itemId: UniqueIdentifier) => itemName(itemId as T)
  const position = (itemId: UniqueIdentifier) => `position ${ids.indexOf(itemId as T) + 1} of ${ids.length}`

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(ids, ids.indexOf(active.id as T), ids.indexOf(over.id as T)))
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[verticalOnly]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Picked up ${name(active.id)}.`,
          onDragOver: ({ active, over }) => (over ? `${name(active.id)} moved to ${position(over.id)}.` : undefined),
          onDragEnd: ({ active, over }) => `${name(active.id)} dropped${over ? ` at ${position(over.id)}` : ''}.`,
          onDragCancel: ({ active }) => `Moving ${name(active.id)} was cancelled.`,
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

/** A list item of a `SortableList`, moved by the `DragHandle` inside it. */
export function SortableItem({ id, className = '', children }: { id: string; className?: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`${className} ${isDragging ? 'relative z-10 shadow-2xl shadow-black/60 ring-1 ring-primary' : ''}`}
    >
      <DragHandleContext value={{ attributes, listeners, attach: setActivatorNodeRef }}>{children}</DragHandleContext>
    </li>
  )
}

/** The grip its `SortableItem` is dragged by. */
export function DragHandle({ label, className = '' }: { label: string; className?: string }) {
  const handle = useContext(DragHandleContext)
  if (!handle) throw new Error('DragHandle must be inside a SortableItem.')
  const { attach, attributes, listeners } = handle
  return (
    <button
      type="button"
      ref={attach}
      {...attributes}
      {...listeners}
      aria-label={label}
      className={`flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white active:cursor-grabbing ${className}`}
    >
      <GripVertical size={18} />
    </button>
  )
}
