import { defineStore } from "pinia";

interface State {
    joined: boolean
    data: {
        owner: boolean;
        id: string;
        title: string;
    }
}

export const useGameStore = defineStore('game', {
    state: (): State => ({
        joined: false,
        data: {
            owner: false,
            id: '',
            title: '',
        }
    })
})