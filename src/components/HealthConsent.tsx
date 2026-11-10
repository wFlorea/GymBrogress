import Link from 'next/link'

/** The explicit consent body details need, shown until it's given. */
export function HealthConsent({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-sunken p-3 text-xs leading-relaxed text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <span>
        I agree that GymBrogress keeps my body details (weight, height, age, sex, body fat, activity level and weigh-ins),
        which can count as health data, to work out my BMI, calories and progress. I can withdraw this any time in Settings.{' '}
        <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
          Privacy Policy
        </Link>
      </span>
    </label>
  )
}
