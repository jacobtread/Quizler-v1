/**
 * This file stores constants which are passed in by Vite through the
 * .env file these will remain constant after build but can be changed
 * in the dev environment by adding VITE_THE_VAR_NAME=VALUE to the .env
 * file
 */

/**
 * Determines the websocket host value based on the provided
 * host environment variable. If the host value is "origin"
 * then the websocket will use the current window location
 * origin and determine whether wss or ws should be used
 *
 * @param value The original host value
 */
function getHost(value: string | undefined): string {
    if (!value || value === 'origin') {
        let host = window.location.origin
            .replace(/^https/, 'wss')
            .replace(/^http/, 'ws');
        if (!host.endsWith('/')) host += '/';
        host += 'ws';
        return host;
    } else {
        return value;
    }
}

// The websocket host url
export const HOST: string = getHost(import.meta.env.VITE_HOST);
// Whether to do debug logging
export const DEBUG: boolean = import.meta.env.VITE_DEBUG == 'true';
// The maximum amount of questions a user can create
export const MAX_QUESTIONS = 16;
// The maximum amount of answers each question can have
export const MAX_ANSWERS = 9;

// Debug log the current host
console.debug(`Web socket host is ${HOST}`);