package main

import (
	"backend/game"
	. "backend/net"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

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

	var rawPacket = PacketRaw{}

	// The last time in milliseconds when a keep alive was received
	lastKeepAlive := game.Time()

	var hostOf *game.Game
	var activeGame *game.Game
	var activePlayer *game.Player

	conn := NewConnection(ws)

	for conn.Open {
		// The current system time
		currentTime := game.Time()
		// The elapsed time since the last keep alive
		elapsed := currentTime - lastKeepAlive

		if elapsed > 10000 { // If we didn't receive a Keep Alive Packet within the last 5000ms
			// Then we disconnect the client for "Connection timed out"
			conn.Send(DisconnectPacket("Connection timed out"))
			break
		}

		// Read incoming packet into the raw packet map
		err = ws.ReadJSON(&rawPacket)
		if err != nil { // If packet parsing failed or the ID was missing
			// Disconnect the client for sending invalid data
			conn.Send(DisconnectPacket("Failed to decode packet"))
			log.Println("Failed to decode packet", err)
			break
		}

		switch rawPacket.Id {
		case CKeepAlive:
			lastKeepAlive = currentTime
			conn.Send(KeepAlivePacket())
		case CDisconnect:
			log.Printf("Player disconnected")
			if activeGame != nil { // If we are in a game
				activeGame.RemovePlayer(activePlayer) // Remove the player from the game
				activePlayer = nil                    // Set the player to nil
				activeGame = nil                      // Set the game to nil
			}
			if hostOf != nil { // If the host exists stop the server
				hostOf.Stop() // Stop the server
				hostOf = nil  // Clear the host
			}
		case CCreateGame:
			RequireData(rawPacket, func(data *CreateGameData) {
				// Create a new game
				hostOf = game.New(conn, data.Title, data.Questions)
				// Tell the host they've joined the new game as owner
				conn.Send(JoinGamePacket(true, hostOf.Id, hostOf.Title))
				log.Printf("Created new game '%s' (%s)", hostOf.Title, hostOf.Id)
			})
		case CCheckNameTaken:
			RequireData(rawPacket, func(data *CheckNameTakenData) {
				g := game.Get(data.Id) // Retrieve the game
				if g == nil {          // If the game doesn't exist
					conn.Send(ErrorPacket("That game code doesn't exist"))
				} else {

					taken := g.IsNameTaken(data.Name)       // Check if the name is taken
					conn.Send(NameTakenResultPacket(taken)) // Send the result
				}
			})
		case CRequestGameState: // Client requested game state
			RequireData(rawPacket, func(data *RequestGameStateData) {
				log.Printf("Client requested game state for '%s'", data.Id)
				g := game.Get(data.Id)
				if g == nil { // If the game doesn't exist
					conn.Send(GameStatePacket(game.DoesNotExist))
				} else {
					// Send the current game state
					conn.Send(GameStatePacket(g.State))
				}
			})
		case CRequestJoin:
			RequireData(rawPacket, func(data *RequestJoinData) {
				activeGame = game.Get(data.Id)
				if activeGame == nil {
					conn.Send(ErrorPacket("That game code doesn't exist"))
				} else {
					if activeGame.State != game.Waiting { // If the game isn't in waiting state
						log.Printf("%d", activeGame.State)
						conn.Send(ErrorPacket("That game is already started"))
					} else if activeGame.IsNameTaken(data.Name) { // If the name is already taken
						conn.Send(ErrorPacket("That name is already in use"))
						activeGame = nil // Clear the active game
					} else {
						// Join and set the active player
						activePlayer = activeGame.Join(conn, data.Name)
						// Tell the host they've joined the new game as a player
						conn.Send(JoinGamePacket(false, activeGame.Id, activeGame.Title))
					}
				}
			})
		case CStart:
			if hostOf == nil {
				conn.Send(ErrorPacket("Failed to start game. You aren't hosting one?"))
			} else if hostOf.State != game.Waiting {
				conn.Send(ErrorPacket("Game is already started/starting"))
			} else {
				hostOf.Start()
			}
		case CAnswer:
			activePlayer.Net.Send(ErrorPacket("Not implemented"))
		// TODO: Handle answer submit
		case CKick:
			if hostOf != nil {
				RequireData(rawPacket, func(data *KickData) {
					p := hostOf.Players.Get(data.Id)
					if p != nil {
						hostOf.RemovePlayer(p)
					}
				})
			}
		}
	}

	if hostOf != nil {
		hostOf.Stop()
	}

	if activePlayer != nil && activeGame != nil {
		activeGame.RemovePlayer(activePlayer)
	}
}
