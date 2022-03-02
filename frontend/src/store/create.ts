import { QuestionData } from "@api/packets";
import { reactive } from "vue";

// The structure of this store
interface State {
    questions: QuestionData[];
    title: string
}

// A central store for storing the creating information
export const store = reactive<State>({
    questions: [],
    title: '',
})
