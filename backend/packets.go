package main

type PacketId uint32
type PacketData interface{}

const (
	UnknownId     PacketId = 0x00
	KeepAliveId            = 0x01
	DisconnectId           = 0x02
	ErrorId                = 0x03
	CreateGameId           = 0x04
	RequestJoinId          = 0x05
	JoinGameId             = 0x06
	PlayerDataId           = 0x07
	GameStateId            = 0x08
	QuestionId             = 0x09
	AnswerId               = 0x0A
	TimeId                 = 0x0B
	WinnersID              = 0x0C
	DestroyId              = 0x0E
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
	Questions []QuestionData
}

type RequestJoinData struct {
	Name string `json:"name"`
	Game string `json:"game"`
}

func GetPacket(id PacketId, data interface{}) Packet {
	return Packet{Id: id, Data: data}
}

func GetErrorPacket(cause string) Packet {
	return Packet{Id: ErrorId, Data: struct {
		Cause string `json:"cause"`
	}{Cause: cause}}
}

func GetDisconnectPacket(reason string) Packet {
	return Packet{Id: DisconnectId, Data: DisconnectData{Reason: reason}}
}

func GetDisconnectOtherPacket(id string, reason string) Packet {
	return Packet{Id: DisconnectId, Data: struct {
		Id     string `json:"id"`
		Reason string `json:"reason"`
	}{Id: id, Reason: reason}}
}

func GetPlayerDataPacket(id string, name string) Packet {
	return Packet{Id: PlayerDataId, Data: struct {
		Id   string `json:"id"`
		Name string `json:"name"`
	}{}}
}

func GetJoinGamePacket(id string, title string, owner bool) Packet {
	return Packet{Id: JoinGameId, Data: struct {
		Owner bool   `json:"owner"`
		Id    string `json:"id"`
		Title string `json:"title"`
	}{Id: id, Title: title, Owner: owner}}
}

func GetKeepAlive() Packet {
	return Packet{Id: KeepAliveId, Data: nil}
}
