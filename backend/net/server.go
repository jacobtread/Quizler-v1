package net

import "backend/types"

// Ids for server packets
const (
	SKeepAlive       PacketId = 0x00
	SDisconnect               = 0x01
	SError                    = 0x02
	SJoinedGame               = 0x03
	SNameTakenResult          = 0x04
	SGameState                = 0x05
	SPlayerData               = 0x06
	SQuestion                 = 0x07
	STimeSync                 = 0x08
	SGameOver                 = 0x09
)

// DisconnectPacket creates a new disconnect packet with the provided reason
func DisconnectPacket(reason string) Packet {
	return Packet{Id: SDisconnect, Data: struct {
		Reason string `json:"reason"` // The reason for disconnecting
	}{Reason: reason}}
}

// KeepAlivePacket creates a new keep alive packet
func KeepAlivePacket() Packet {
	return Packet{Id: SKeepAlive}
}

type PlayerDataMode = uint8

const (
	AddMode PlayerDataMode = iota
	ReplaceMode
	RemoveMode
)

// ErrorPacket creates a new error packet with the provided cause
func ErrorPacket(cause string) Packet {
	return Packet{Id: SError, Data: struct {
		Cause string `json:"cause"`
	}{Cause: cause}}
}

// PlayerDataPacket creates a new player data packet with the provided id and name
func PlayerDataPacket(id string, name string, mode PlayerDataMode) Packet {
	return Packet{Id: SPlayerData, Data: struct {
		Id   string         `json:"id"`   // The id of the player
		Name string         `json:"name"` // The name of the player
		Mode PlayerDataMode `json:"mode"` // The type of mode to use when dealing with this
	}{Id: id, Name: name, Mode: mode}}
}

// JoinGamePacket creates a new join game data packet with the provided values
func JoinGamePacket(owner bool, id string, title string) Packet {
	return Packet{Id: SJoinedGame, Data: struct {
		Owner bool   `json:"owner"` // Whether the player is the host/owner of the quiz
		Id    string `json:"id"`    // The id of the joined game
		Title string `json:"title"` // The title of the joined game
	}{Id: id, Title: title, Owner: owner}}
}

// NameTakenResultPacket creates a new name taken result packet with the provided result
func NameTakenResultPacket(result bool) Packet {
	return Packet{Id: SNameTakenResult, Data: struct {
		Result bool `json:"result"` // The result of the name taken check
	}{Result: result}}
}

// GameStatePacket creates a new game state packet with the provided state
func GameStatePacket(state types.State) Packet {
	return Packet{Id: SGameState, Data: struct {
		State types.State `json:"state"`
	}{State: state}}
}
