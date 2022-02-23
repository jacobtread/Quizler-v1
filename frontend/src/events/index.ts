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


export const events = mitt<Events>() // The event system


export function toast(content: string, type: ToastType = ToastType.INFO) {
    events.emit('toast', {id: 0, content, type})
}