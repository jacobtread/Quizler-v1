package net

import (
	"backend/tools"
)

// Ids for client packets
const (
	CDisconnect       PacketId = 0x00
	CCreateGame                = 0x01
	CCheckNameTaken            = 0x02
	CRequestGameState          = 0x03
	CRequestJoin               = 0x04
	CStart                     = 0x05
	CAnswer                    = 0x06
	CKick                      = 0x07
)

// Different types for client packets
type (

	// KickData A structure representing the data a client will send to kick a player
	KickData struct {
		Id string `json:"id"` // The id of the player to kick
	}

	// CreateGameData A structure representing the data a client will send to create a game
	CreateGameData struct {
		Title     string               `json:"title"`     // The title of the game
		Questions []tools.QuestionData `json:"questions"` // The questions to include in the game
	}

	// CheckNameTakenData A structure representing a client checking the server for if a name
	// is already in use
	CheckNameTakenData struct {
		Id   string `json:"id"`   // The id of the quiz to check names in
		Name string `json:"name"` // The name to check if is taken
	}

	// RequestGameStateData A structure representing a client requesting the current state of
	// a game from the server this will be followed up with a SGameState packet
	RequestGameStateData struct {
		Id string `json:"id"` // The id of the game to get the state of
	}

	// RequestJoinData A structure representing a client requesting to join a game with the
	// provided Id using the provided Name
	RequestJoinData struct {
		Id   string `json:"id"`   // The id of the game (game code)
		Name string `json:"name"` // The name to join the game with
	}

	// AnswerData A structure representing a client answering a question with the index
	AnswerData struct {
		Id tools.AnswerIndex `json:"id"` // The index of the answer
	}
)
