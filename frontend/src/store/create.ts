import { reactive } from "vue";
import { QuestionDataWithValues } from "@/api";

// The structure of this store
interface State {
    questions: QuestionDataWithValues[];
    title: string;
}

// A central store for storing the creating information
export const store = reactive<State>({
    questions: [],
    title: '',
});
