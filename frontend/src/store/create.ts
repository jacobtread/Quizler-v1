import { defineStore } from "pinia";
import { QuestionData } from "@api/packets";

interface State {
    questions: QuestionData[];
    title: string
}

export const useCreateStore = defineStore('create', {
    state: (): State => ({
        questions: [],
        title: ''
    })
})