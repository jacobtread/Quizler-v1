package tools

import (
	"math/rand"
	"os"
	"time"
)

type (
	// Identifier represents a unique identifier
	Identifier = string

	// State type for game states represented as an 8-bit integer
	State = uint8

	// AnswerIndex represents the index for an answer as an integer
	AnswerIndex = uint32

	// QuestionIndex represents the index for a question as an integer
	QuestionIndex = int

	// QuestionData A structure representing a question for the quiz
	QuestionData struct {
		Image    string        // Optional - an image to display with the question
		Question string        // The actual contents of the question
		Answers  []string      // The possible answer values
		Values   []AnswerIndex // The indexes of the correct answers
	}

	// ScoreMap A map of player identifiers to score values
	ScoreMap = map[Identifier]uint32
)

// EnvOrDefault Used to retrieve an environment variable or the provided
// default value if that environment variable doesn't exist
func EnvOrDefault(key string, d string) string {
	value, exists := os.LookupEnv(key) // Lookup the environment variable
	if !exists {                       // If the variable doesn't exist
		return d // Return the default value-
	}
	return value
}

// FreeMemory Used to free up memory from questions that have already been
// served to the user. (This is done by setting the image to a blank string)
// as most images will take up a few MB or so while in use
func (question *QuestionData) FreeMemory() {
	question.Image = ""
}

// CreateRandomId Creates a random identifier of the specified length using
// the chars from A-F and numbers 0 to 9
func CreateRandomId(length uint8) Identifier {
	chars := []rune("ABCDEF0123456789") // Define the available chars
	out := make([]rune, length)         // Create a new rune array of the provided length
	for i := range out {                // For every index of the rune array
		// Pick a random char from the available chars and set it
		out[i] = chars[rand.Intn(16)]
	}
	// Return the new identifier
	return Identifier(out)
}

// Time Retrieves the current time in milliseconds
func Time() time.Duration {
	return time.Duration(time.Now().UnixNano())
}
