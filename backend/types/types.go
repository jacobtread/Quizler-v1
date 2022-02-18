package types

// State type for game states represented as an 8-bit integer
type State = uint8

// AnswerIndex represents the index for an answer as a 16-bit integer
type AnswerIndex = int16

// QuestionIndex represents the index for a question as a 16-bit integer
type QuestionIndex = int16

// QuestionData A structure representing a question for the quiz
type QuestionData struct {
	Image    string        // Optional - an image to display with the question
	Question string        // The actual contents of the question
	Answers  []string      // The possible answer values
	Values   []AnswerIndex // The indexes of the correct answers
}
