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
	// Server the public dir (will be used later to serve the app)
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

// SocketState A structure representing the state of a socket instance
type SocketState struct {
	Hosted *game.Game   // The hosted player
	Game   *game.Game   // The active game
	Player *game.Player // The active player

	*Connection // The websocket connection
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

	var rawPacket = PacketRaw{}               // The structure for packets to be decoded into as id and raw dat
	conn := NewConnection(ws)                 // Create a new connection
	var state = SocketState{Connection: conn} // Create a new state with the connection

	for conn.Open { // As long as the connection is still open
		// Read incoming packet into the raw packet map
		err = ws.ReadJSON(&rawPacket)
		if err != nil { // If packet parsing failed or the ID was missing
			if conn.Open { // Ignore this message if the client is not connected any more
				// Disconnect the client for sending invalid data
				conn.Send(DisconnectPacket("Failed to decode packet"))
				log.Println("Failed to decode packet", err)
			}
			break
		}

		switch rawPacket.Id {
		case CCreateGame:
			HandlePacket(rawPacket, state.onCreateGame)
		case CCheckNameTaken:
			HandlePacket(rawPacket, state.onCheckNameTaken)
		case CRequestGameState:
			HandlePacket(rawPacket, state.onRequestGameState)
		case CRequestJoin:
			HandlePacket(rawPacket, state.onRequestJoin)
		case CStateChange:
			HandlePacket(rawPacket, state.onStateChange)
		case CAnswer:
			HandlePacket(rawPacket, state.onAnswer)
		case CKick:
			HandlePacket(rawPacket, state.onKick)
		}
	}
	state.Cleanup() // Cleanup the state
}

// Cleanup Stops any hosted games by the state and removes the player
// from any games if the player isn't the host
func (state *SocketState) Cleanup() {
	if state.Hosted != nil {
		state.Hosted.Stop()
		state.Hosted = nil
	}
	if state.Game != nil && state.Player != nil {
		state.Game.RemovePlayer(state.Player)
		state.Game = nil
		state.Player = nil
	}
}

// onCreateGame Packet handler function for the net.CCreateGame packet. Handles
// the creation of new games
func (state *SocketState) onCreateGame(data *CreateGameData) {
	g := game.New(state.Connection, data.Title, data.Questions) // Create a new game
	state.Hosted = g                                            // Set the hosted game for this state
	state.Send(JoinGamePacket(true, g.Id, g.Title))             // Tell the host they've joined the new game as owner
	state.Send(GameStatePacket(game.Waiting))                   // Tell the player the game state is waiting
	log.Printf("Created new game '%state' (%state)", g.Title, g.Id)
}

// onCheckNameTaken Packet handler function for the net.CCheckNameTaken packet. Handles
// checking whether a name is already in use.
func (state *SocketState) onCheckNameTaken(data *CheckNameTakenData) {
	g := game.Get(data.Id) // Retrieve the game
	if g == nil {          // If the game doesn't exist
		state.Send(ErrorPacket("That game code doesn't exist"))
	} else {
		taken := g.IsNameTaken(data.Name)        // Check if the name is taken
		state.Send(NameTakenResultPacket(taken)) // Send the result
	}
}

// onRequestGameState Packet handler function for the net.CRequestGameState packet. Handles
// retrieving and sending the player the state of a game. Will send back game.DoesNotExist
// if the game is not found
func (state *SocketState) onRequestGameState(data *RequestGameStateData) {
	log.Printf("Client requested game state for '%state'", data.Id)
	g := game.Get(data.Id)
	if g == nil { // If the game doesn't exist
		state.Send(GameStatePacket(game.DoesNotExist))
	} else {
		// Send the current game state
		state.Send(GameStatePacket(g.State))
	}
}

// onRequestJoin Packet handler function for the net.CRequestJoin packet. Handles
// client requests to join a game. Sent by a client which wishes to join a game
func (state *SocketState) onRequestJoin(data *RequestJoinData) {
	g := game.Get(data.Id) // Retrieve the game with that ID
	if g == nil {
		state.Send(ErrorPacket("That game code doesn't exist"))
	} else {
		if g.State != game.Waiting { // If the game isn't in waiting state
			log.Printf("%d", g.State)
			state.Send(ErrorPacket("That game is already started"))
		} else if g.IsNameTaken(data.Name) { // If the name is already taken
			state.Send(ErrorPacket("That name is already in use"))
		} else {
			state.Player = g.Join(state.Connection, data.Name) // Join and set the active player
			state.Game = g                                     // Set the active game
			state.Send(JoinGamePacket(false, g.Id, g.Title))   // Tell the host they've joined the new game as a player
		}
	}
}

// onStateChange Packet handler function for the net.CStateChange packet. Handles
// client state updates this can be disconnecting, starting the game, skipping the
// question. Basically a general packet for small changes between the client server
// that requires no additional data
func (state *SocketState) onStateChange(data *StateChangeData) {
	hosted := state.Hosted
	switch data.State {
	case CDisconnect: // If the client asked to disconnect from the game
		log.Printf("Client disconnected")
		state.Cleanup() // Cleanup the state (stop games and remove player)
	case CStart: // If the client told the server to start the game
		if hosted == nil { // If the player is not hosting a game
			state.Send(ErrorPacket("Failed to update game state. You aren't hosting one?"))
		} else if hosted.State != game.Waiting { // If the game is already started
			state.Send(ErrorPacket("Game is already started/starting"))
		} else {
			hosted.Start() // Start the game
		}
	case CSkip: // If the client told the server to skip the current question (host only)
		if hosted == nil { // If the hosted game doesn't exist
			state.Send(ErrorPacket("Failed to update game state. You aren't hosting one?"))
		} else if hosted.State != game.Started { // If the game is not in the started state
			state.Send(ErrorPacket("Game is not started"))
		} else {
			hosted.SkipQuestion() // Skip the question
		}
	default: // If the state change is an unknown state change
		log.Printf("Don't know how to handle state '%d'", data.State)
	}
}

// onAnswer Packet handler function for the net.CAnswer packet. Handles
// selection of an answer by a player in the game. Along with handling on
// cases such as players already answering
func (state *SocketState) onAnswer(data *AnswerData) {
	g := state.Game
	player := state.Player
	if g == nil || player == nil { // If player is not in a  game
		state.Send(ErrorPacket("Not in a game"))
	} else if player.HasAnswered(g) { // If the player has already answered
		state.Send(ErrorPacket("You have already answered the question."))
	} else {
		player.Answer(g, data.Id) // Submit the player answer
	}
}

// onKick Packet handler function for the net.CKick packet. Handles
// kicking players from the game (Host only)
func (state *SocketState) onKick(data *KickData) {
	hosted := state.Hosted // Retrieve the hosted game
	if hosted != nil {     // Ensure the hosted game exists
		p := hosted.Players.Get(data.Id) // Retrieve the player
		if p != nil {                    // If the player exists
			hosted.RemovePlayer(p)                           // Remove the player from the game
			p.Net.Send(DisconnectPacket("Kicked from game")) // Send a disconnect packet to the player
		}
	}
}
