package net

import (
	. "backend/tools"
	. "github.com/jacobtread/gowsps"
	"time"
)

// Ids for server packets
const (
	SDisconnect      VarInt = 0x00
	SError                  = 0x01
	SJoinedGame             = 0x02
	SNameTakenResult        = 0x03
	SGameState              = 0x04
	SPlayerData             = 0x05
	STimeSync               = 0x06
	SQuestion               = 0x07
	SAnswerResult           = 0x08
	SScores                 = 0x09
)

// DisconnectPacket creates a new disconnect packet with the provided reason
func DisconnectPacket(reason string) Packet {
	return Packet{Id: SDisconnect, Data: struct {
		Reason string
	}{Reason: reason}}
}

type PlayerDataMode = uint8

const (
	AddMode    PlayerDataMode = iota // Add the player to player lists
	RemoveMode                       // Remove the player from player lists
	SelfMode                         // Set this as the player for whoever this is sent to
)

// ErrorPacket creates a new error packet with the provided cause
func ErrorPacket(cause string) Packet {
	return Packet{Id: SError, Data: struct {
		Cause string
	}{Cause: cause}}
}

// PlayerDataPacket creates a new player data packet with the provided id and name
func PlayerDataPacket(id string, name string, mode PlayerDataMode) Packet {
	return Packet{Id: SPlayerData, Data: struct {
		Id   string         // The id of the player
		Name string         // The name of the player
		Mode PlayerDataMode // The type of mode to use when dealing with this
	}{Id: id, Name: name, Mode: mode}}
}

// JoinGamePacket creates a new join game data packet with the provided values
func JoinGamePacket(owner bool, id string, title string) Packet {
	return Packet{Id: SJoinedGame, Data: struct {
		Id    string // The id of the joined game
		Owner bool   // Whether the player is the host/owner of the quiz
		Title string // The title of the joined game
	}{Id: id, Title: title, Owner: owner}}
}

// NameTakenResultPacket creates a new name taken result packet with the provided result
func NameTakenResultPacket(result bool) Packet {
	return Packet{Id: SNameTakenResult, Data: struct {
		Result bool // The result of the name taken check
	}{Result: result}}
}

// GameStatePacket creates a new game state packet with the provided state
func GameStatePacket(state State) Packet {
	return Packet{Id: SGameState, Data: struct {
		State State
	}{State: state}}
}

// TimeSyncPacket creates a new time sync packet which keeps the current timing
// of the server countdowns in sync with the clients
func TimeSyncPacket(total time.Duration, remaining time.Duration) Packet {
	return Packet{Id: STimeSync, Data: struct {
		Total     VarInt
		Remaining VarInt
	}{Total: VarInt(total.Milliseconds()), Remaining: VarInt(remaining.Milliseconds())}}
}

// QuestionPacket creates a new question packet which informs the client which
// question they are currently answering
func QuestionPacket(data QuestionData) Packet {
	return Packet{Id: SQuestion, Data: struct {
		Image    []byte
		Question string
		Answers  []string
	}{Image: data.Image, Question: data.Question, Answers: data.Answers}}
}

// AnswerResultPacket creates a new answer result packet which informs the client
// whether the answer they chose was correct after marking
func AnswerResultPacket(result bool) Packet {
	return Packet{Id: SAnswerResult, Data: struct {
		Result bool
	}{Result: result}}
}

// ScoresPacket creates a new score packet which contains the scores of all the
// players in the game. This is sent to everyone when scores change
func ScoresPacket(data ScoreMap) Packet {
	return Packet{Id: SScores, Data: struct {
		Scores ScoreMap
	}{Scores: data}}
}
