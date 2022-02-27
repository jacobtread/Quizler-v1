/**
 * This file stores constants which are passed in by Vite through the
 * .env file these will remain constant after build but can be changed
 * in the dev environment by adding VITE_THE_VAR_NAME=VALUE to the .env
 * file
 */
function getHost(value: string | undefined): string {
    if (!value || value === 'origin') {
        let host = window.location.origin.replace(/^(http(s)?)/g, 'ws')
        if (!host.endsWith('/')) host += '/'
        host += 'ws'
        return host
    } else {
        return value
    }
}

// The websocket host url
export const HOST: string = getHost(import.meta.env.VITE_HOST)
// Whether to do debug logging
export const DEBUG: boolean = import.meta.env.VITE_DEBUG == 'true'

console.debug(`Web socket host is ${HOST}`)