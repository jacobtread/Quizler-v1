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
)

// Packet Represents a structure for a packet each packet contains an
// Id unique to that command which represents how it should be parsed
// and the data that needs to be parsed is Data
type Packet struct {
	Id   PacketId   `json:"id"`
	Data PacketData `json:"data,omitempty"`
}

// ErrorPacket Represents the structure for the packet data of error
// packets contains a string for the cause of the error to better
// report the error
type ErrorPacket struct {
	Cause string `json:"cause"`
}

// DisconnectPacket Represents the structure for the packet data of
// disconnect packets used by the client and server to describe the
// Reason of the player leaving
type DisconnectPacket struct {
	Reason string `json:"reason"`
}

// DisconnectOtherPacket Represents the structure for the packet data of
// disconnect packets for other players used to inform clients when
// Another player is disconnected
type DisconnectOtherPacket struct {
	Id     uint16 `json:"id"`
	Reason string `json:"reason"`
}

type CreateGamePacket struct {
	Title     string `json:"title"`
	Questions []game.QuestionData
}

type JoinGamePacket struct {
	Id    string `json:"id"`
	Title string `json:"title"`
}

func GetPacket(id PacketId, data interface{}) Packet {
	return Packet{Id: id, Data: data}
}

func GetErrorPacket(cause string) Packet {
	return Packet{Id: Error, Data: ErrorPacket{Cause: cause}}
}

func GetDisconnectPacket(reason string) Packet {
	return Packet{Id: Disconnect, Data: DisconnectPacket{Reason: reason}}
}

func GetKeepAlive() Packet {
	return Packet{Id: KeepAlive, Data: nil}
}
