import { JoinGameData } from "@api/packets";
import { GameState, PlayerMap } from "@/api";
import mitt from "mitt";

type Events = {
    open: boolean;
    game: JoinGameData | null; // Event for updating the game data
    players: PlayerMap; // Event for updating the player list
    gameState: GameState; // Event for the game state check result
    nameTaken: boolean; // Event for the result of a name taken check
    reset: void; // Event for resetting the game state
    toast: Toast; // Event for creating toasts
    dialog: DialogData; // Event for creating dialogs
}

export enum ToastType {
    INFO,
    ERROR,
    WARNING
}

export interface Toast {
    id: number;
    type: ToastType;
    content: string;
}

export interface DialogData {
    title: string;
    content: string;
}


export const events = mitt<Events>() // The event system


export function toast(content: string, type: ToastType = ToastType.INFO) {
    events.emit('toast', {id: 0, content, type})
}

export function dialog(title: string, content: string) {
    events.emit('dialog', {title, content})
}