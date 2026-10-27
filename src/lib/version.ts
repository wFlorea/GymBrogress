import pkg from '../../package.json'

/** The app version from package.json, shown as "v1.2" (or "v1.2.1" for a fix release). */
export const APP_VERSION = `v${pkg.version.replace(/\.0$/, '')}`
