/**
 * This file stores constants which are passed in by Vite through the
 * .env file these will remain constant after build but can be changed
 * in the dev environment by adding VITE_THE_VAR_NAME=VALUE to the .env
 * file
 */
// The websocket host url
export const HOST: string = import.meta.env.VITE_HOST
// Whether to do debug logging
export const DEBUG: boolean = import.meta.env.VITE_DEBUG == 'true'
// Whether to exclude keep alive packets from debug logging (the large volume fills the console)
export const DEBUG_IGNORE_KEEP_ALIVE: boolean = import.meta.env.VITE_DEBUG_IGNORE_KEEP_ALIVE == 'true'
