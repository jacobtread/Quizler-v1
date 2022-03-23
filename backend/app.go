package main

import (
	"backend/game"
	. "backend/net"
	"backend/tools"
	_ "embed"
	"fmt"
	"github.com/jacobtread/gowsps"
	"log"
	"net/http"
)

// Build with go build -o Quizler.exe -ldflags "-w"

const (
	Version = "1.0.5"
	Intro   = `
   __         __       ___  __  
  /  \ |  | |  / |    |__  |__) 
  \__X \__/ | /_ |___ |___ |  \   by Jacobtread
  
  Version %s    Server Started on http://localhost:%s

  - Even smaller than last time. :O

`
)

// Embed the web page index into the application as an array of bytes
// this allows me to serve the HTML file straight from memory. And
// due to the size of the file this works very well.
//go:embed public/index.html
var appIndex []byte

func main() {
	address := tools.EnvOrDefault("QUIZLER_ADDRESS", "0.0.0.0") // Retrieve the address environment variable
	port := tools.EnvOrDefault("QUIZLER_PORT", "8080")          // Retrieve the port environment variable
	host := fmt.Sprintf("%s:%s", address, port)                 // Create a host url from ADDRESS:PORT

	fmt.Printf(Intro, Version, port) // Print the intro message

	// Create a handler for handling http requests
	http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		if request.URL.Path == "/ws" { // If the user accessed the websocket endpoint
			SocketConnect(writer, request) // Create a socket connection
		} else {
			writer.Header().Set("Content-Type", "text/html") // Set the Content-Type as HTML
			_, _ = writer.Write(appIndex)                    // Write the index HTML body to the response
		}
	})

	err := http.ListenAndServe(host, nil) // Listen on the provided address
	if err != nil {                       // If we encountered an error
		log.Fatal("An error occurred", err) // Print out the error
	}
}

// SocketState A structure representing the state of a socket instance
type SocketState struct {
	Hosted *game.Game   // The hosted player
	Game   *game.Game   // The active game
	Player *game.Player // The active player

	*gowsps.Connection // The websocket connection
}

//SocketConnect Creates a socket connection and upgrades the HTTP request to WS
func SocketConnect(w http.ResponseWriter, r *http.Request) {
	s := gowsps.NewPacketSystem()
	var state = SocketState{} // Create a new state with the connection

	// Add handlers for each of
	gowsps.AddHandler(s, CCreateGame, state.onCreateGame)
	gowsps.AddHandler(s, CCheckNameTaken, state.onCheckNameTaken)
	gowsps.AddHandler(s, CRequestGameState, state.onRequestGameState)
	gowsps.AddHandler(s, CRequestJoin, state.onRequestJoin)
	gowsps.AddHandler(s, CStateChange, state.onStateChange)
	gowsps.AddHandler(s, CAnswer, state.onAnswer)
	gowsps.AddHandler(s, CKick, state.onKick)

	s.UpgradeAndListen(w, r, func(conn *gowsps.Connection, err error) {
		state.Connection = conn
	})

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
	log.Printf("Created new game '%s' (%s)", g.Title, g.Id)
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
	log.Printf("Client requested game state for '%s'", data.Id)
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
