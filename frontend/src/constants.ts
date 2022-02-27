/**
 * This file stores constants which are passed in by Vite through the
 * .env file these will remain constant after build but can be changed
 * in the dev environment by adding VITE_THE_VAR_NAME=VALUE to the .env
 * file
 */
// The websocket host url
export const HOST: string = import.meta.env.VITE_HOST ?? (window.location.origin + '/ws')
// Whether to do debug logging
export const DEBUG: boolean = import.meta.env.VITE_DEBUG == 'true'

if (DEBUG) console.debug(`Web socket host is ${HOST}`)