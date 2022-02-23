package game

import (
	"backend/net"
	. "backend/tools"
	"backend/types"
	"log"
	"strings"
	"time"
)

// Enum for game states
const (
	Waiting      types.State = iota // Waiting for the game to start
	Starting                        // The game is about to start
	Started                         // The game is started an in progress
	Stopped                         // The game has Stopped and is ready to shut down
	DoesNotExist                    // The game doesn't exist
)

// Game a structure representing the game itself
type Game struct {
	Host      *net.Connection      // The connection to the game host
	Id        Identifier           // The unique identifier / game code for this game
	Title     string               // The title / name of this game
	Questions []types.QuestionData // An array of the questions for this game
	Players   PlayerStore          // The player store instance
	StartTime time.Duration        // The system time in ms of when the game was created
	State     types.State          // The current state of the game
}

// Time Retrieves the current time in milliseconds
func Time() time.Duration {
	return time.Duration(time.Now().UnixNano()) / time.Millisecond
}

// Games A map of games to their identifiers
var Games = map[Identifier]*Game{}

// CreateGameId Creates a new game id this will be unique in order to not collided
// with existing game ids so will iterate CreateRandomId until a unique one is found
func CreateGameId() Identifier {
	for {
		id := CreateRandomId(5)
		_, contains := Games[id]
		if !contains { // Check the id doesn't already exist
			return id // Return the id
		}
	}
}

// Get retrieves the game with a matching Identifier or else returns nil
func Get(identifier Identifier) *Game {
	game, contains := Games[identifier]
	if !contains {
		return nil
	}
	return game
}

// New Creates a new game instance with the provided host, title, and questions.
// also starts a new goroutine for the games loop, adds it to Games and returns
// a reference to the game
func New(host *net.Connection, title string, questions []types.QuestionData) *Game {
	id := CreateGameId() // Create a new unique game ID
	game := Game{
		Host:      host,
		Id:        id,
		Title:     title,
		Questions: questions,
		Players:   NewPlayerStore(),
		StartTime: Time(),
		State:     Waiting,
	}
	// Store the game in the games map
	Games[id] = &game
	go game.Loop() // Start a new goroutine for the game loop
	return &game
}

// Join adds a new player to the game with the provided connection and name
// and returns a reference to the player
func (game *Game) Join(conn *net.Connection, name string) *Player {
	player := game.Players.Create(conn, name) // Create a new player
	// Information all other connections that this new player was added
	game.BroadcastExcluding(player.Id, net.PlayerDataPacket(player.Id, name, net.AddMode), true)
	log.Printf("Player '%s' has joined '%s' (%s) given id '%s'", name, game.Title, game.Id, player.Id)
	return player
}

// IsNameTaken checks the game players to see if any other players already
// have a matching name (case-insensitive)
func (game *Game) IsNameTaken(name string) bool {
	return game.Players.AnyMatch(func(player *Player) bool {
		return strings.EqualFold(player.Name, name)
	})
}

// Broadcast sends the provided packet to all the players in the game
func (game *Game) Broadcast(packet net.Packet) {
	// Iterate over all the players
	game.Players.ForEach(func(id Identifier, player *Player) {
		player.Net.Send(packet) // Send the packet to the player
	})
}

// BroadcastExcluding sends the provided packet to all the players in the game
// excluding any players that match the excluded id. The host parameter determines
// whether this packet will also be sent to the host of the game
func (game *Game) BroadcastExcluding(exclude Identifier, packet net.Packet, host bool) {
	// Iterate over all the players
	game.Players.ForEach(func(id Identifier, player *Player) {
		if id != exclude { // If the player id != the excluded id
			player.Net.Send(packet)
		}
	})
	if host { // If this packet should also be sent to the host
		// Send the host the packet as well
		game.Host.Send(packet)
	}
}

// Loop Run the game loop for the provided game
func (game *Game) Loop() {
	for {
		state := game.State

		if state == Stopped { // If the game has stopped
			break // break from the game loop
		}

		// Sleep for one second after every iteration to not put
		// too much stress on the CPU
		time.Sleep(time.Second)
	}
}

// RemovePlayer Deletes the player from the players list. Made thread safe with PLock
func (game *Game) RemovePlayer(player *Player) {
	if game.State != Stopped { // If the game is stopped we don't need to inform the other players

		// Create a remove player data packet
		dataPacket := net.PlayerDataPacket(player.Id, player.Name, net.RemoveMode)
		// Broadcast the packet to all the other players and the host
		game.BroadcastExcluding(player.Id, dataPacket, true)
	}
	// Send a disconnect packet to the player
	player.Net.Send(net.DisconnectPacket("Removed from game"))
	// Remove the player from the player list
	game.Players.Remove(player.Id)
	// Log a debug message saying who was disconnected
	log.Printf("Player '%s' (%s) removed from game '%s' (%s)", player.Name, player.Id, game.Title, game.Id)
}

// Stop Sets the game state to Stopped and calls RemovePlayer
// on all the players. Made thread safe with PLock
func (game *Game) Stop() {
	// Write safe iteration over all the players
	game.Players.ForEachSafe(func(player *Player) {
		// Remove the player
		game.RemovePlayer(player)
	})
	// Log a debug messaging saying the game was stopped
	log.Printf("Stopping game '%s' (%s)", game.Title, game.Id)
}
