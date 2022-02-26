import { QuestionData } from "@api/packets";
import { reactive } from "vue";

interface State {
    questions: QuestionData[];
    title: string
}

export const store = reactive<State>({
    questions: [],
    title: '',
})
