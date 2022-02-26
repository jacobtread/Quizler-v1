/**
 * Clears all the keys on the provided object
 *
 * (Used for updating reactive objects)
 *
 * @param obj The object to clear
 */
export function clearObject(obj: any) {
    for (let key of Object.keys(obj)) {
        delete obj[key]
    }
}

/**
 * Replaces the contents of the original object with the
 * contents of the new object
 *
 * (Used for updating reactive objects)
 *
 * @param obj The original object
 * @param newObj The new object
 */
export function replaceObject(obj: any, newObj: any) {
    for (let key of Object.keys(obj)) { // Loop over existing keys
        // Remove the key if it's not present in the new object
        if (!newObj[key]) delete obj[key]
    }
    for (let dataKey in newObj) { // Loop over the new keys
        obj[dataKey] = newObj[dataKey] // Set the key on the origin object
    }
}