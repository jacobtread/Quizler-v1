package net

import (
	"github.com/mitchellh/mapstructure"
	"log"
)

// PacketId All packet ids are represented as 16-bit integers
type PacketId = uint16

// PacketData All data for packets is of type interface{} as a
// placeholder for its real struct
type PacketData interface{}

// RawPacket The type of data raw packets are parsed into (a string -> interface map)
type RawPacket map[string]interface{}

// RawPacketData The type of data raw packets contents are parsed into (a string -> interface map)
type RawPacketData map[string]interface{}

// Packet The structure for outbound packets
type Packet struct {
	Id   PacketId   `json:"id"`
	Data PacketData `json:"data,omitempty"`
}

// PacketRaw The structure for  inbound packets only used for outbound
// packets in this case though
type PacketRaw struct {
	Id   PacketId      `json:"id"`
	Data RawPacketData `json:"data,omitempty"`
}

// AsType Used to convert the packet data map into the right struct
func Decode[T *interface{}](data RawPacketData, out T) T {
	err := mapstructure.Decode(data, out)
	if err != nil {
		log.Panic(err)
	}
	return out
}
