import { Ref, ref } from "vue";

export enum ToastMode {
    INFO,
    ERROR,
    WARNING
}

export interface Toast {
    id: number;
    mode: ToastMode;
    content: string;
}

export interface DialogData {
    title: string;
    content: string;
}

const dialogData = ref<DialogData | null>(null)
const toastData = ref<Toast[]>([])
let toastId = 0

export const useDialogData = (): Ref<DialogData | null> => dialogData
export const useToastData = (): Ref<Toast[]> => toastData

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
    if (toastData.value.length < 1) toastId = 0
    toastId++ // Increment the toast id
    // Create a new toast object
    const toast: Toast = {id: toastId, content, mode}
    // Add the toast to the toasts list
    toastData.value.push(toast)
    // Set a function to run in 3 seconds
    setTimeout(() => {
        // Remove the current toast from the toasts list
        toastData.value = toastData.value.filter(it => it.id !== toast.id)
        // If it's the last toast reset the toast id
        if (toastData.value.length < 1) toastId = 0
    }, 3000 /* 3 seconds time */)
}

/**
 * Creates a new dialog to display to the user
 *
 * @param title The title of the dialog
 * @param content The message of the dialog
 */
export function dialog(title: string, content: string) {
    dialogData.value = {title, content}
}