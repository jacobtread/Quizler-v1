import { JoinGameData } from "@api/packets";
import { GameState, PlayerMap } from "@/api";
import mitt from "mitt";

type Events = {
    state: string;
    game: JoinGameData | null;
    players: PlayerMap;
    disconnect: string;
    gameState: GameState;
    nameTaken: boolean;
    reset: void;
    toast: Toast;
    dialog: DialogData;
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