package types

import "backend/tools"

// State type for game states represented as an 8-bit integer
type State = uint8

// AnswerIndex represents the index for an answer as an integer
type AnswerIndex = int

// QuestionIndex represents the index for a question as an integer
type QuestionIndex = int

// QuestionData A structure representing a question for the quiz
type QuestionData struct {
	Image    string        // Optional - an image to display with the question
	Question string        // The actual contents of the question
	Answers  []string      // The possible answer values
	Values   []AnswerIndex // The indexes of the correct answers
}

// FreeMemory Used to free up memory from questions that have already been
// served to the user. (This is done by setting the image to a blank string)
// as most images will take up a few MB or so while in use
func (question *QuestionData) FreeMemory() {
	question.Image = ""
}

type ScoreMap = map[tools.Identifier]uint32
