import { btoa } from "Base64";

/**
 * Converts the provided Uint8Array into a base64 data url
 * string of the array contents allowing it to be used as
 * the src for an image tag
 *
 * @param type The type of data stored in the array (e.g. image/png)
 * @param array The array of binary data for the image
 */
export function arrayToDataUrl(type: string, array: Uint8Array): string {
    const fch = String.fromCharCode; // Store the from char code function as a shorthand
    const out: string[] = []; // Empty array of all the char values
    for (let elm of array) {
        out.push(fch(elm)); // Convert the array element to a string and append to array
    }
    // Base64 encode the string
    const base64: string = btoa(out.join('') /* Join all the strings to one big string*/);
    // Append the data url parts and return the data
    return `data:${type};base64,${base64}`
}