import { defineStore } from "pinia";
import { QuestionData } from "../api/packets";

interface State {
    questions: QuestionData[]
}

export const useCreateStore = defineStore('create', {
    state: (): State => ({
        questions: []
    })
})