import { ExerciseBrowser } from '@/components/ExerciseBrowser'
import { Page, PageHeader } from '@/components/ui/Page'

export const metadata = { title: 'Exercise library' }

export default function ExercisesPage() {
  return (
    <Page>
      <PageHeader title="Exercise library" subtitle="Search by name or filter by muscle group to see how each exercise is done." />
      <ExerciseBrowser />
    </Page>
  )
}
