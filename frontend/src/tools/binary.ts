import { btoa } from "Base64";

const fch = String.fromCharCode

export function arrayToBase64(array: Uint8Array): string {
    const out = [];
    for (let elm of array) {
        out.push(fch(elm))
    }
    return btoa(out.join(''))
}

export function arrayToDataUrl(type: string,array: Uint8Array): string {
    const base64 = arrayToBase64(array)
    return `data:${type};base64,${base64}`
}