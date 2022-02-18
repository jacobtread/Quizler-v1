import { defineStore } from "pinia";

interface State {
    joined: boolean;
    name: string;
    data: {
        owner: boolean;
        id: string;
        title: string;
    }
}

export const useGameStore = defineStore('game', {
    state: (): State => ({
        joined: false,
        name: '',
        data: {
            owner: false,
            id: '',
            title: '',
        }
    })
})