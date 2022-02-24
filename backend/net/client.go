package net

import "backend/types"

// Ids for client packets
const (
	CKeepAlive        PacketId = 0x00
	CDisconnect                = 0x01
	CCreateGame                = 0x02
	CCheckNameTaken            = 0x03
	CRequestGameState          = 0x04
	CRequestJoin               = 0x05
	CStart                     = 0x06
	CAnswer                    = 0x07
	CKick                      = 0x08
)

// KickData A structure representing the data a client will send to kick a player
type KickData struct {
	Id string `json:"id"` // The id of the player to kick
}

// CreateGameData A structure representing the data a client will send to create a game
type CreateGameData struct {
	Title     string               `json:"title"`     // The title of the game
	Questions []types.QuestionData `json:"questions"` // The questions to include in the game
}

// CheckNameTakenData A structure representing a client checking the server for if a name
// is already in use
type CheckNameTakenData struct {
	Id   string `json:"id"`   // The id of the quiz to check names in
	Name string `json:"name"` // The name to check if is taken
}

// RequestGameStateData A structure representing a client requesting the current state of
// a game from the server this will be followed up with a SGameState packet
type RequestGameStateData struct {
	Id string `json:"id"` // The id of the game to get the state of
}

// RequestJoinData A structure representing a client requesting to join a game with the
// provided Id using the provided Name
type RequestJoinData struct {
	Id   string `json:"id"`   // The id of the game (game code)
	Name string `json:"name"` // The name to join the game with
}

// AnswerData A structure representing a client answering a question with the index
type AnswerData struct {
	Id types.AnswerIndex `json:"id"` // The index of the answer
}
