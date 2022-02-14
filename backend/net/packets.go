package net

import game "backend/game"

type PacketId uint32
type PacketData interface{}

const (
	Unknown     PacketId = 0x00
	KeepAlive            = 0x01
	Disconnect           = 0x02
	Error                = 0x03
	CreateGame           = 0x04
	RequestJoin          = 0x05
	JoinGame             = 0x06
	PlayerData           = 0x07
	GameState            = 0x08
	Question             = 0x09
	Answer               = 0x0A
	Time                 = 0x0B
	Winners              = 0x0C
)

// Packet Represents a structure for a packet each packet contains an
// Id unique to that command which represents how it should be parsed
// and the data that needs to be parsed is Data
type Packet struct {
	Id   PacketId   `json:"id"`
	Data PacketData `json:"data,omitempty"`
}

// DisconnectData Represents the structure for the packet data of
// disconnect packets used by the client and server to describe the
// Reason of the player leaving
type DisconnectData struct {
	Reason string `json:"reason"`
}

type CreateGameData struct {
	Title     string `json:"title"`
	Questions []game.QuestionData
}

func GetPacket(id PacketId, data interface{}) Packet {
	return Packet{Id: id, Data: data}
}

func GetErrorPacket(cause string) Packet {
	return Packet{Id: Error, Data: struct {
		Cause string `json:"cause"`
	}{Cause: cause}}
}

func GetDisconnectPacket(reason string) Packet {
	return Packet{Id: Disconnect, Data: DisconnectData{Reason: reason}}
}

func GetDisconnectOtherPacket(id string, reason string) Packet {
	return Packet{Id: Disconnect, Data: struct {
		Id     string `json:"id"`
		Reason string `json:"reason"`
	}{Id: id, Reason: reason}}
}

func GetPlayerDataPacket(id string, name string) Packet {
	return Packet{Id: PlayerData, Data: struct {
		Id   string `json:"id"`
		Name string `json:"name"`
	}{}}
}

func GetJoinGamePacket(id string, title string) Packet {
	return Packet{Id: JoinGame, Data: struct {
		Id    string `json:"id"`
		Title string `json:"title"`
	}{Id: id, Title: title}}
}

func GetKeepAlive() Packet {
	return Packet{Id: KeepAlive, Data: nil}
}
