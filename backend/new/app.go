package main

import (
	"backend/new/game"
	"backend/new/net"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/mitchellh/mapstructure"
	"log"
	"net/http"
)

type Connection websocket.Conn

func main() {
	gin.SetMode(gin.ReleaseMode)
	g := gin.Default()
	// Create a new web socket endpoint
	g.GET("/ws", SocketConnect)
	// Server the public dir for use later
	g.Use(static.Serve("/", static.LocalFile("./public", true)))
	// Run the server
	err := g.Run()
	if err != nil {
		log.Fatal("An error occurred", err)
	}
}

// upgrader Used to upgrade HTTP requests to the WS protocol
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

//SocketConnect Creates a socket connection and upgrades the HTTP request to WS
func SocketConnect(c *gin.Context) {
	// Try to upgrade the http connection to a web socket connection
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil { // If we failed to upgrade the connection
		log.Fatal("Failed to upgrade connection", err)
	}
	// Deferred closing of the socket when we are done this will result
	// in ws.Close being called after this function is finished executing
	defer func(ws *websocket.Conn) { _ = ws.Close() }(ws)

	var rawPacket net.RawPacket = map[string]interface{}{}

	// Whether the client should continue running in a loop and accepting packets
	running := true
	// The last time in milliseconds when a keep alive was received
	lastKeepAlive := game.Time()

	for running {
		// sends the provided packet over the websocket
		// and stops the connection if an error occurs
		Send := func(packet net.Packet) {
			if running { // Only send packets if we are running
				err := ws.WriteJSON(packet) // Write the packet json out
				// If we got an error stop the running loop
				if err != nil {
					running = false
				}
			}
		}
		// The current system time
		currentTime := game.Time()
		// The elapsed time since the last keep alive
		elapsed := currentTime - lastKeepAlive

		if elapsed > 5000 { // If we didn't receive a Keep Alive Packet within the last 5000ms
			// Then we disconnect the client for "Connection timed out"
			Send(net.DisconnectPacket("Connection timed out"))
		}

		rawPacket = map[string]interface{}{}

		delete(rawPacket, "id")

		// Read incoming packet into the raw packet map
		err = ws.ReadJSON(&rawPacket)
		id, idExists := rawPacket["id"]
		if err != nil || !idExists { // If packet parsing failed or the ID was missing
			// Disconnect the client for sending invalid data
			Send(net.DisconnectPacket("Client sent invalid data"))
			break
		}

		var activeGame game.Game
		var activePlayer game.Player

		switch id.(net.PacketId) {
		case net.CKeepAlive:
			lastKeepAlive = currentTime
			Send(net.KeepAlivePacket())
		case net.CDisconnect:
			log.Printf("Client disconnected")
			running = false
		case net.CCreateGame:
			RequireData(rawPacket, func(data *net.CreateGameData) {

			})
		case net.CRequestGameState: // Client requested game state
			log.Printf("Client requested game state for")
			RequireData(rawPacket, func(data *net.RequestGameStateData) {
				g := game.Get(data.Id)
				if g != nil {

				}

			})
		}
	}

}

func RequireData[T interface{}](rawPacket net.RawPacket, action func(data *T)) {
	d, dataExists := rawPacket["data"]
	if dataExists {
		raw := d.(net.RawPacketData)
		out := T{}
		err := mapstructure.Decode(raw, &out)
		if err != nil {
			log.Panic(err)
		}
		action(&out)
	} else {
		log.Printf("Packet with id '%x' expected data but recieved none", id)
	}
}
