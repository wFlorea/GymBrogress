import { Lora } from 'next/font/google'

/** Serif for page titles and big headlines, used through `font-display`. Its variable is set on <body> in the root layout. */
export const lora = Lora({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-lora' })
