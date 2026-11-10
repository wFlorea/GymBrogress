import Link from 'next/link'
import { ContactEmail, LegalList, LegalPage, LegalSection, legalLinkStyles } from '@/components/LegalPage'
import { MIN_AGE } from '@/lib/body'
import { OPERATOR } from '@/lib/legal'

export const metadata = {
  title: 'Terms of Service',
  description: 'The rules for using GymBrogress, and the limits of what it can tell you.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <LegalSection title="Who runs this">
        <p>
          GymBrogress is run by {OPERATOR.name}, an individual based in {OPERATOR.country}. Contact: <ContactEmail />. By
          creating an account or using the app, you accept these terms. How your data is handled is explained in the{' '}
          <Link href="/privacy" className={legalLinkStyles}>
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Not medical advice">
        <p>
          <strong>GymBrogress is a tracker, not a doctor, dietitian or coach.</strong> Calories, macros, BMI, one-rep maxes,
          weight plans and exercise descriptions are estimates and general information for healthy adults. They may not suit
          you.
        </p>
        <p>
          Talk to a doctor before starting or changing a diet or training plan, especially if you&apos;re pregnant, have a
          medical condition, an injury, or a history of disordered eating. Stop if something hurts or feels wrong. You train
          and diet at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="Who can use it">
        <p>
          You must be {MIN_AGE} or older. Give accurate details, keep your password to yourself, and use only your own
          account. You&apos;re responsible for what happens in it.
        </p>
      </LegalSection>

      <LegalSection title="Food information">
        <p>
          Food values come from{' '}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className={legalLinkStyles}>
            Open Food Facts
          </a>{' '}
          (Open Database Licence), USDA FoodData Central, and products sent in by users. They can be wrong or out of date, so
          check the label when it matters, above all for allergies.
        </p>
      </LegalSection>

      <LegalSection title="Products you send in">
        <LegalList>
          <li>Send only real products, accurate values, and photos you took yourself, with no people in them.</li>
          <li>
            You allow us, free of charge and for as long as the app runs, to add the product&apos;s name, barcode and
            nutrition values to the list every user can search.
          </li>
          <li>Your photos are only used to check the product. A product can be refused without giving a reason.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="What you can't do">
        <LegalList>
          <li>Break the law with the app, or use it to harm anyone.</li>
          <li>Try to get at other people&apos;s data, or attack, overload or get around the app&apos;s security.</li>
          <li>Copy the app&apos;s data in bulk with automated tools.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="The app itself">
        <p>
          GymBrogress is free. If that ever changes, you&apos;ll be told first and nothing will be charged without your
          agreement. The app&apos;s design and code belong to its operator, apart from open-source parts under their own
          licences.
        </p>
        <p>
          It&apos;s provided as it is, and it can change, have errors, go offline or stop. Export your data now and then if
          you want your own copy.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          As far as the law allows, the operator isn&apos;t liable for indirect losses or for lost data. Nothing here limits
          liability for death or injury caused by negligence, for intentional harm or gross negligence, or any right you have
          as a consumer that can&apos;t be waived.
        </p>
      </LegalSection>

      <LegalSection title="Ending your account">
        <p>
          You can delete your account at any time in Settings. An account that breaks these terms can be suspended or removed.
        </p>
      </LegalSection>

      <LegalSection title="Law and changes">
        <p>
          These terms are governed by the law of {OPERATOR.country}. If you live elsewhere in the EU, you keep the mandatory
          consumer protections of your own country. If the terms change, the date at the top changes too, and important
          changes will be announced in the app.
        </p>
      </LegalSection>

      <LegalSection title="Credits and licences">
        <p>GymBrogress is built on open data and open-source software.</p>
        <LegalList>
          <li>
            <strong>Packaged foods:</strong> © Open Food Facts contributors, available under the{' '}
            <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noreferrer" className={legalLinkStyles}>
              Open Database License
            </a>
            .
          </li>
          <li>
            <strong>Everyday foods:</strong> USDA FoodData Central, in the public domain.
          </li>
          <li>
            <strong>Fonts:</strong> Inter and Lora, under the SIL Open Font License.
          </li>
          <li>
            <strong>Icons:</strong> Lucide, under the ISC License.
          </li>
          <li>
            <strong>Barcode reading:</strong> barcode-detector and zxing-wasm, under the MIT License.
          </li>
          <li>The other open-source packages the app uses, each under its own licence.</li>
        </LegalList>
      </LegalSection>
    </LegalPage>
  )
}
