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
}

export const events = mitt<Events>() // The event system
