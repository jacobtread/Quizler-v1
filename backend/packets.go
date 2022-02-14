package main

type PacketId uint32
type PacketData interface{}

const (
	Unknown PacketId = iota
	KeepAlive
	Error
	Disconnect
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

// DisconnectOther Represents the structure for the packet data of
// disconnect packets for other players used to inform clients when
// Another player is disconnected
type DisconnectOther struct {
	Id     uint16 `json:"id"`
	Reason string `json:"reason"`
}

func GetPacket(id PacketId, data interface{}) Packet {
	return Packet{Id: id, Data: data}
}

func GetErrorPacket(cause string) Packet {
	return Packet{Id: Error, Data: ErrorPacket{Cause: cause}}
}

func getDisconnectPacket(reason string) Packet {
	return Packet{Id: Disconnect, Data: DisconnectPacket{Reason: reason}}
}

func GetKeepAlive() Packet {
	return Packet{Id: KeepAlive, Data: nil}
}
