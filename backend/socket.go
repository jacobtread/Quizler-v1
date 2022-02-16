package main

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/mitchellh/mapstructure"
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

	// The struct to store decoded packets in (UnknownId by default)
	packet := Packet{Id: UnknownId}

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
			// DisconnectId the client for sending invalid data
			_ = ws.WriteJSON(GetDisconnectPacket("Client sent invalid data"))
			break
		}

		var g *Game = nil
		var player *Player = nil

		var packetData map[string]interface{}
		if packet.Data != nil {
			packetData = packet.Data.(map[string]interface{})
		}
		switch packet.Id {
		case DisconnectId:
			data := OfType(packetData, DisconnectData{}).(DisconnectData)
			log.Printf("Client disconnected reason '%s'", data)
			// End the connection with the client
			running = false
		case KeepAliveId:
			// Update last time the client was kept alive
			lastKeepAlive = currentTime
			// Return a keep alive to the client
			Send(GetKeepAlive())
			if player != nil {
				player.LastAlive = lastKeepAlive
			}
		case CreateGameId:
			data := OfType(packetData, CreateGameData{}).(CreateGameData)
			g = CreateGame(data.Title, data.Questions)
			log.Printf("Created new game with id '%s' and title '%s'", g.Id, g.Title)
			Send(GetJoinGamePacket(g.Id, g.Title))
		case RequestJoinId:
			data := OfType(packetData, RequestJoinData{}).(RequestJoinData)
			g = GetGame(data.Game)
			if g == nil {
				Send(GetErrorPacket("That game code doesn't exist"))
			} else {
				if g.State != Waiting {
					Send(GetErrorPacket("That game is already started"))
				} else {
					player = JoinGame(data.Name, ws, g)
					Send(GetJoinGamePacket(g.Id, g.Title))
				}
			}
		default:
			if g != nil && player != nil {
				HandlePacket(g, player, packet.Id, packetData)
			}
		}
	}
}

func OfType(data map[string]interface{}, ref interface{}) interface{} {
	err := mapstructure.Decode(data, &ref)
	if err != nil {
		log.Panic(err)
	}
	return ref
}
