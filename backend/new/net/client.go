package net

// Ids for client packets
const (
	CKeepAlive        PacketId = 0x00
	CDisconnect                = 0x01
	CCreateGame                = 0x02
	CCheckNameTaken            = 0x03
	CRequestGameState          = 0x04
	CRequestJoin               = 0x05
	CAnswer                    = 0x06
	CDestroy                   = 0x07
)

// State type for game states represented as an 8-bit integer
type State = uint8

// AnswerIndex represents the index for an answer as a 16-bit integer
type AnswerIndex = int16

// QuestionIndex represents the index for a question as a 16-bit integer
type QuestionIndex = int16

// CreateGameData A structure representing the data a client will send to create a game
type CreateGameData struct {
	Title     string         `json:"title"`     // The title of the game
	Questions []QuestionData `json:"questions"` // The questions to include in the game
}

// QuestionData A structure representing a question for the quiz
type QuestionData struct {
	Image    string        // Optional - an image to display with the question
	Question string        // The actual contents of the question
	Answers  []string      // The possible answer values
	Values   []AnswerIndex // The indexes of the correct answers
}

type RequestGameStateData struct {
	Id string `json:"id"` // The id of the game to get the state of
}
