package main

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

// upgrader Used to upgrade HTTP requests to the WS protocol
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func Test() {
	bytes, err := json.Marshal(GetKeepAlive())
	if err != nil {
		log.Println(err)
		return
	}
	println(string(bytes))
}

//SocketConnect Creates a socket connection and upgrades the HTTP request to WS
func SocketConnect(c *gin.Context) {
	Test()
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Fatal("Failed to upgrade connection", err)
	}
	// Deferred closing of the socket when we are done
	defer func(ws *websocket.Conn) {
		_ = ws.Close()
	}(ws)

	command := Packet{Id: Unknown}

	running := true

loop:
	// Infinitely loop until the connection is closed
	for running {

		// Read the incoming command into the Command struct
		err = ws.ReadJSON(&command)
		if err != nil {
			// If the JSON parsing failed response to the client with an error
			_ = ws.WriteJSON(GetErrorPacket("Invalid data received"))
			// And disconnect the client
			_ = ws.WriteJSON(getDisconnectPacket("Client sent invalid data"))
			break
		}

		Send := func(packet Packet) {
			err := ws.WriteJSON(packet)
			if err != nil {
				running = false
				return
			}
		}

		switch command.Id {
		case Disconnect:
			var data = command.Data.(DisconnectPacket)
			log.Printf("Client disconnected reason '%s'", data)
			break loop
		case KeepAlive:
			Send(GetKeepAlive())
		}
	}
}
