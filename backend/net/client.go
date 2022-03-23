package net

import (
	"backend/tools"
	"fmt"
	"github.com/jacobtread/gowsps"
	"reflect"
)

// Ids for client packets
const (
	CCreateGame       gowsps.VarInt = 0x00
	CCheckNameTaken                 = 0x01
	CRequestGameState               = 0x02
	CRequestJoin                    = 0x03
	CStateChange                    = 0x04
	CAnswer                         = 0x05
	CKick                           = 0x06
)

type StateChangeId = uint8

const (
	CDisconnect StateChangeId = iota
	CStart
	CSkip
)

// Different types for client packets
type (

	// KickData A structure representing the data a client will send to kick a player
	KickData struct {
		Id string // The id of the player to kick
	}

	// CreateGameData A structure representing the data a client will send to create a game
	CreateGameData struct {
		Title     string               // The title of the game
		Questions []tools.QuestionData // The questions to include in the game
	}

	// CheckNameTakenData A structure representing a client checking the server for if a name
	// is already in use
	CheckNameTakenData struct {
		Id   string // The id of the quiz to check names in
		Name string // The name to check if is taken
	}

	// RequestGameStateData A structure representing a client requesting the current state of
	// a game from the server this will be followed up with a SGameState packet
	RequestGameStateData struct {
		Id string // The id of the game to get the state of
	}

	// RequestJoinData A structure representing a client requesting to join a game with the
	// provided Id using the provided Name
	RequestJoinData struct {
		Id   string // The id of the game (game code)
		Name string // The name to join the game with
	}

	// StateChangeData A structure representing a client requesting state change
	StateChangeData struct {
		State StateChangeId // The state to update
	}

	// AnswerData A structure representing a client answering a question with the index
	AnswerData struct {
		Id tools.AnswerIndex // The index of the answer
	}
)

type CustomInt = uint8

func T() {
	x := CustomInt(21)
	switch reflect.ValueOf(x).Interface().(type) {
	case uint8:
		fmt.Printf("INT8")
	default:
		fmt.Printf("Nope")
	}

}
