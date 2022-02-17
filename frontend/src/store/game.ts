import { defineStore } from "pinia";
import { PlayerData } from "@api/packets";

interface State {
    joined: boolean
    data: {
        owner: boolean;
        id: string;
        title: string;
        players: PlayerData
    }
}

export const useGameStore = defineStore('create', {
    state: (): State => ({
        joined: false,
        data: {
            owner: false,
            id: '',
            title: '',
        }
    })
})