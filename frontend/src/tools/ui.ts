import { reactive, Ref, ref, UnwrapNestedRefs } from "vue";

// Enum for choosing what type of toast message should be displayed
export enum ToastMode {
    INFO,
    ERROR
}

// Structure for a toast contains the mode, content and a unique id
export interface Toast {
    id: number;
    mode: ToastMode;
    content: string;
}

// The structure for dialog data
export interface DialogData {
    title: string;
    content: string;
    action?: (result: boolean) => any;
}

// The structure of the loader state
export interface LoaderState {
    visible: boolean;
    message: string;
}

// The data for the loader
const loader = reactive<LoaderState>({visible: false, message: 'Loading...'});
const dialogData = ref<DialogData | null>(null); // The data for the dialog
const toastData = ref<Toast[]>([]); // The list of toasts
let toastId = 0; // The current id for toasts

// Function for using the dialog data
export const useDialogData = (): Ref<DialogData | null> => dialogData;
// Function for using the toast data
export const useToastData = (): Ref<Toast[]> => toastData;
// Function for using the loader data
export const useLoaderData = (): UnwrapNestedRefs<LoaderState> => loader;

/**
 * Creates a new "toast" which is a small information popup
 * in the corner of the window for information that is easily
 * dismissible and doesn't require the full attention of the user
 *
 * @param content The message for the toast
 * @param mode The type of toast that this is
 */
export function toast(content: string, mode: ToastMode = ToastMode.INFO) {
    // If it's the first toast reset the toast id
    if (toastData.value.length < 1) toastId = 0;
    toastId++ // Increment the toast id
    // Create a new toast object
    const toast: Toast = {id: toastId, content, mode};
    // Add the toast to the toasts list
    toastData.value.push(toast);
    // Set a function to run in 3 seconds
    setTimeout(() => {
        // Remove the current toast from the toasts list
        toastData.value = toastData.value.filter(it => it.id !== toast.id);
        // If it's the last toast reset the toast id
        if (toastData.value.length < 1) toastId = 0;
    }, 3000 /* 3 seconds time */);
}

/**
 * Creates a new dialog to display to the user
 *
 * @param title The title of the dialog
 * @param content The message of the dialog
 */
export function dialog(title: string, content: string) {
    dialogData.value = {title, content};
}

/**
 * Creates a new dialog to display to the user returns a promise
 * which the dialog will resolve on selection of an answer
 *
 * @param title The title of the dialog
 * @param content The message of the dialog
 */
export async function confirmDialog(title: string, content: string): Promise<boolean> {
    return new Promise(resolve => {
        dialogData.value = {title, content, action: resolve};
    });
}

/**
 * Used to change the loading state of the page.
 *
 * @param value Whether the page is loading or not
 * @param message The message to display in the loader
 */
export function loading(value: boolean, message: string = 'Loading...') {
    loader.visible = value;
    loader.message = message;
}