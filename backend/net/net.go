package net

import (
	"github.com/gorilla/websocket"
	"github.com/mitchellh/mapstructure"
	"log"
	"sync"
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

// Connection represents a connection to a websocket has extension function
// for doing actions such as sending packets
type Connection struct {
	Open   bool            // Whether the connection is still open or not
	Socket *websocket.Conn // The connection to the socket
	Lock   *sync.RWMutex   // Write lock for the
}

// NewConnection Creates a new connection struct and sets the close handler
func NewConnection(ws *websocket.Conn) *Connection {
	// Create the new connection
	conn := Connection{Socket: ws, Open: true, Lock: &sync.RWMutex{}}
	ws.SetCloseHandler(func(code int, text string) error {
		// Print to the console that the connection closed
		log.Printf("Websocket connection closed '%s' (%d)", text, code)
		// Set the connection open to false
		conn.Open = false
		return nil
	})
	// Return the connection pointer
	return &conn
}

// Send will send the provided packet to the connection socket
func (conn *Connection) Send(packet Packet) {
	if conn.Open { // Only send the packet if the connection is open
		conn.Lock.Lock()
		// Write the packet to the socket as JSON
		err := conn.Socket.WriteJSON(packet)
		conn.Lock.Unlock()
		if err != nil { // If the packet failed to write
			log.Printf("Failed to send packet '%x'", packet.Id)
		}
	}
}

// RequireData wraps around the packet data to create a type safe decoding
// from the packet data map to the packet struct
func RequireData[T interface{}](rawPacket PacketRaw, action func(data *T)) {
	d := rawPacket.Data
	if d != nil {
		out := new(T)
		err := mapstructure.Decode(d, out)
		if err != nil {
			log.Panic(err)
		}
		action(out)
	} else {
		log.Printf("Packet with id '%x' expected data but recieved none", rawPacket.Id)
	}
}
