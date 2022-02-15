import { defineStore } from "pinia";
import { QuestionData } from "../api/packets";

interface State {
    questions: QuestionData[]
}

export const useCreateStore = defineStore('create', {
    state: (): State => ({
        questions: [
            {
                title: 'Example',
                question: 'How often does EXAMPLE like to do EXAMPLE',
                answers: [
                    'Once a week',
                    'Once a year',
                    'Never',
                    'Only sometimes'
                ],
                answer: 3
            }
        ]
    })
})