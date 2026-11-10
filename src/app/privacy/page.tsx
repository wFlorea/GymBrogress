import Link from 'next/link'
import { ContactEmail, LegalList, LegalPage, LegalSection, legalLinkStyles } from '@/components/LegalPage'
import { MIN_AGE } from '@/lib/body'
import { OPERATOR } from '@/lib/legal'
import { UNCONFIRMED_SIGNUP_DAYS, WAITING_PRODUCT_DAYS } from '@/lib/retention'

export const metadata = {
  title: 'Privacy Policy',
  description: 'What GymBrogress keeps about you, why, who else sees it, and how to get it deleted.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        GymBrogress is a free gym and food tracker. There are no ads and no analytics, and your data is never sold. This
        page explains what the app keeps, why, and what you can do about it.
      </p>

      <LegalSection title="Who is responsible for your data">
        <p>
          {OPERATOR.name}, an individual based in {OPERATOR.country}, runs GymBrogress and is the data controller. For
          anything about your data, or to reach me if you can&apos;t sign in, email <ContactEmail />.
        </p>
      </LegalSection>

      <LegalSection title="What the app keeps">
        <LegalList>
          <li>
            <strong>Account:</strong> your name or nickname, your email and your password (stored only as a hash), and when
            you accepted the Terms.
          </li>
          <li>
            <strong>Training:</strong> your schedule, routines, workouts, sets and pinned exercises.
          </li>
          <li>
            <strong>Food:</strong> what you log, saved meals, water, and your goal weight and calorie and macro goals.
          </li>
          <li>
            <strong>Body details, if you add them:</strong>{' '}
            weight, height, age, sex, body fat, activity level and weekly weigh-ins. These can count as health data, so they&apos;re only kept with your explicit consent.
          </li>
          <li>
            <strong>Products you send in:</strong> the barcode, name, nutrition values and two photos of the pack. The
            photos are re-saved on your phone first, which removes location and camera details.
          </li>
          <li>
            <strong>Reminders, if you turn them on:</strong>{' '}
            your device&apos;s push address and its time zone.
          </li>
          <li>
            <strong>Technical logs:</strong> our hosting providers record IP addresses and requests to keep the service
            running and secure.
          </li>
        </LegalList>
        <p>
          The barcode scanner reads the camera on your phone, and its pictures are not sent anywhere. Only the number it
          finds is looked up.
        </p>
      </LegalSection>

      <LegalSection title="Why, and on what legal basis">
        <LegalList>
          <li>
            <strong>To run the app for you</strong> (your account, training and food log, your goals, account emails):
            performing our contract with you, GDPR Art. 6(1)(b).
          </li>
          <li>
            <strong>Your body details:</strong> your explicit consent, Art. 6(1)(a) and 9(2)(a). The app works without them.
          </li>
          <li>
            <strong>Push reminders:</strong> your consent, Art. 6(1)(a).
          </li>
          <li>
            <strong>Checking products you send in, and keeping the service secure:</strong> our legitimate interest in an
            accurate food list and a safe service, Art. 6(1)(f).
          </li>
        </LegalList>
        <p>
          Your daily calories and macros are worked out with a simple formula from what you enter. Nothing is decided about
          you automatically in a way that has legal or similar effects.
        </p>
      </LegalSection>

      <LegalSection title="Who else handles it">
        <LegalList>
          <li>
            <strong>Supabase</strong> stores the database, sign-in and product photos, on servers in Frankfurt, Germany.
          </li>
          <li>
            <strong>Vercel</strong> hosts the app and sees requests, including your IP address.
          </li>
          <li>
            <strong>Resend</strong> delivers account emails, so it receives your email address.
          </li>
          <li>
            <strong>Open Food Facts</strong>, a French non-profit, receives food searches and barcode numbers from our
            server, without your name or IP address.
          </li>
          <li>
            <strong>jsDelivr</strong>{' '}
            supplies the scanner&apos;s barcode reader on phones without a built-in one, so it
            sees your IP address when the file downloads.
          </li>
          <li>
            <strong>Your browser&apos;s push service</strong> (Google, Apple, Mozilla or Microsoft) delivers reminders if
            you turn them on.
          </li>
        </LegalList>
        <p>
          Some of these companies are based in the United States. Where data leaves the EU, the transfer relies on a
          safeguard the GDPR allows, such as an adequacy decision or the European Commission&apos;s standard contractual
          clauses.
        </p>
      </LegalSection>

      <LegalSection title="How long it's kept">
        <LegalList>
          <li>Your account and everything in it stay until you delete them.</li>
          <li>
            Photos of products you send in are deleted once the product is checked, or when you delete your account. A
            product nobody checks within {WAITING_PRODUCT_DAYS} days is deleted with its photos.
          </li>
          <li>
            Approved products stay in the shared list after that. They hold only the barcode, name and nutrition values,
            with nothing that links them to you.
          </li>
          <li>A sign-up whose email is never confirmed is deleted after {UNCONFIRMED_SIGNUP_DAYS} days.</li>
          <li>Provider logs and backups can hold copies for a limited time before they expire.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Cookies and storage on your device">
        <p>The app only uses what it needs to work, so it doesn&apos;t ask for cookie consent. Nothing here tracks you.</p>
        <LegalList>
          <li>
            <strong>sb-…-auth-token</strong> cookies keep you signed in, until you sign out or the session ends.
          </li>
          <li>
            <strong>tz</strong>{' '}
            remembers your time zone so &ldquo;today&rdquo; is right, for 1 year.
          </li>
          <li>
            <strong>welcome-seen</strong> skips the welcome slides next time, for 1 year.
          </li>
          <li>
            <strong>checkin_dismissed</strong> hides the weekly check-in after you skip it, for 7 days.
          </li>
          <li>
            <strong>gymbrogress:set-changes</strong>{' '}
            in your browser&apos;s storage holds sets logged without signal until
            they&apos;re sent.
          </li>
          <li>
            A <strong>service worker</strong> receives the reminders, if you turn them on.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can ask to access, correct, delete or move your data, and to restrict or object to how it&apos;s used. Most of
          this is built in:
        </p>
        <LegalList>
          <li>
            <strong>Get a copy:</strong> Settings, Export my data.
          </li>
          <li>
            <strong>Correct it:</strong> edit it in the app.
          </li>
          <li>
            <strong>Withdraw consent for body details:</strong> Settings, Remove my body data.
          </li>
          <li>
            <strong>Stop reminders:</strong> turn them off in Settings.
          </li>
          <li>
            <strong>Delete everything:</strong> Settings, Delete account.
          </li>
        </LegalList>
        <p>
          For anything else, email <ContactEmail />. I&apos;ll answer within one month. Withdrawing consent doesn&apos;t
          affect what happened before you withdrew it.
        </p>
        <p>
          You can also complain to the Romanian data protection authority,{' '}
          <a href="https://www.dataprotection.ro" target="_blank" rel="noreferrer" className={legalLinkStyles}>
            ANSPDCP
          </a>
          , or to the authority where you live.
        </p>
      </LegalSection>

      <LegalSection title="Age">
        <p>
          GymBrogress is for people aged {MIN_AGE} or older. If you believe someone younger has an account, email{' '}
          <ContactEmail /> and it will be deleted.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this policy changes, the date at the top changes too, and important changes will be announced in the app. See
          also the{' '}
          <Link href="/terms" className={legalLinkStyles}>
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
