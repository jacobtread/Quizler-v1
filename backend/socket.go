package main

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"time"
)

// upgrader Used to upgrade HTTP requests to the WS protocol
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

//SocketConnect Creates a socket connection and upgrades the HTTP request to WS
func SocketConnect(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Fatal("Failed to upgrade connection", err)
	}
	// Deferred closing of the socket when we are done this will result
	// in ws.Close being called after this function is finished executing
	defer func(ws *websocket.Conn) { _ = ws.Close() }(ws)

	// The struct to store decoded packets in (Unknown by default)
	packet := Packet{Id: Unknown}

	// Whether the client should continue running in a loop and accepting packets
	running := true

	// The last time in milliseconds when a keep alive was received
	lastKeepAlive := time.Millisecond

	// Infinitely loop until the connection is closed
	for running {

		// sends the provided packet over the websocket
		// and stops the connection if an error occurs
		Send := func(packet Packet) {
			if running {
				err := ws.WriteJSON(packet)
				if err != nil {
					running = false
					return
				}
			}
		}

		currentTime := time.Millisecond
		elapsed := currentTime - lastKeepAlive

		if elapsed > 5000 { // If we didn't receive a Keep Alive Packet within the last 5000ms
			// Then we disconnect the client for "Connection timed out"
			Send(GetDisconnectPacket("Connection timed out"))
		}

		// Read the incoming packet into the Command struct
		err = ws.ReadJSON(&packet)
		if err != nil {
			// Disconnect the client for sending invalid data
			_ = ws.WriteJSON(GetDisconnectPacket("Client sent invalid data"))
			break
		}

		fmt.Println(packet)

		switch packet.Id {
		case Disconnect:
			var data = packet.Data.(DisconnectPacket)
			log.Printf("Client disconnected reason '%s'", data)
			// End the connection with the client
			running = false
		case KeepAlive:
			// Update last time the client was kept alive
			lastKeepAlive = currentTime
			// Return a keep alive to the client
			Send(GetKeepAlive())
		}
	}
}
