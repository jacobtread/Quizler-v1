package game

import (
	"backend/net"
	"backend/types"
	"github.com/gorilla/websocket"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"
)

// Identifier represents a unique identifier
type Identifier = string

// Enum for game states
const (
	Waiting      types.State = iota // Waiting for the game to start
	Started                         // The game is started an in progress
	Stopped                         // The game has Stopped and is ready to shut down
	DoesNotExist                    // The game doesn't exist
)

// Connection represents a connection to a websocket has extension function
// for doing actions such as sending packets
type Connection struct {
	Socket *websocket.Conn // The connection to the socket
}

// Game a structure representing the game itself
type Game struct {
	Host      Connection             // The connection to the game host
	Id        Identifier             // The unique identifier / game code for this game
	Title     string                 // The title / name of this game
	Questions []types.QuestionData   // An array of the questions for this game
	Players   map[Identifier]*Player // A map of the player identifiers to the players
	PLock     *sync.RWMutex          // A lock for safe concurrent modification of the players map
	StartTime time.Duration          // The system time in ms of when the game was created
	State     types.State            // The current state of the game
}

// Player A structure representing a player in the game
type Player struct {
	Net     Connection                                // The connection to the player socket
	Id      Identifier                                // The unique ID of this player
	Name    string                                    // The name of this player
	Score   uint16                                    // The score this player has
	Answers map[types.QuestionIndex]types.AnswerIndex // A map of the question index to the answer chosen
}

// CreateRandomId Creates a random identifier of the specified length using
// the chars from A-F and numbers 0 to 9
func CreateRandomId(length uint8) Identifier {
	chars := []rune("ABCDEF0123456789") // Define the available chars
	out := make([]rune, length)         // Create a new rune array of the provided length
	for i := range out {                // For every index of the rune array
		// Pick a random char from the available chars and set it
		out[i] = chars[rand.Intn(16)]
	}
	// Return the new identifier
	return Identifier(out)
}

// Send will send the provided packet to the connection socket
func (conn *Connection) Send(packet net.Packet) {
	// Write the packet to the socket as JSON
	err := conn.Socket.WriteJSON(packet)
	if err != nil { // If the packet failed to write
		log.Printf("Failed to send packet '%x'", packet.Id)
	}
}

// Time Retrieves the current time in milliseconds
func Time() time.Duration {
	return time.Duration(time.Now().UnixNano()) / time.Millisecond
}

const (
	IdLength       = 5 // The length game id's should be
	PlayerIdLength = 6 // The length player id's should be
)

// Games A map of games to their identifiers
var Games = map[Identifier]*Game{}

// CreateGameId Creates a new game id this will be unique in order to not collided
// with existing game ids so will iterate CreateRandomId until a unique one is found
func CreateGameId() Identifier {
	for {
		id := CreateRandomId(IdLength)
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
func New(host *websocket.Conn, title string, questions []types.QuestionData) *Game {
	id := CreateGameId()
	game := Game{
		Host:      Connection{Socket: host},
		Id:        id,
		Title:     title,
		Questions: questions,
		Players:   map[Identifier]*Player{},
		PLock:     &sync.RWMutex{},
		StartTime: Time(),
		State:     Waiting, // The default game state is waiting (for players)
	}
	Games[id] = &game
	go game.Loop() // Start a new goroutine for the game loop
	return &game
}

// CreatePlayerId Creates a unique player Identifier and ensures it is not already
// used by any other players
func (game *Game) CreatePlayerId() Identifier {
	game.PLock.RLock()         // Lock the read/writes of the player list
	defer game.PLock.RUnlock() // Defer the unlocking of the player list
	for {
		id := CreateRandomId(PlayerIdLength)
		_, contains := game.Players[id]
		if !contains { // Check the id doesn't already exist
			return id // Return the id
		}
	}
}

// Join adds a new player to the game with the provided connection and name
// and returns a reference to the player
func (game *Game) Join(conn *websocket.Conn, name string) *Player {
	id := game.CreatePlayerId()
	player := Player{
		Net:     Connection{Socket: conn},
		Id:      id,
		Name:    name,
		Score:   0,
		Answers: map[types.QuestionIndex]types.AnswerIndex{},
	}

	game.PLock.RLock()                               // Lock reading of the players list for thread safety
	for otherId, otherPlayer := range game.Players { // Loop over all other players
		// Send the player the information about the other player
		player.Net.Send(net.PlayerDataPacket(otherId, otherPlayer.Name, net.AddMode))
	}
	game.PLock.RUnlock()

	// Create a player added packet for this new player
	selfAddPacket := net.PlayerDataPacket(id, name, net.AddMode)

	// Information all other connections that this new player was added
	game.BroadcastExcluding(id, selfAddPacket)
	// Inform the host that a new player was added
	game.Host.Send(selfAddPacket)

	game.PLock.Lock() // Lock write locks so we can modify the player list
	game.Players[id] = &player
	game.PLock.Unlock() // Unlock write lock

	log.Printf("Player '%s' has joined '%s' (%s) given id '%s'", name, game.Title, game.Id, id)

	return &player
}

// IsNameTaken checks the game players to see if any other players already
// have a matching name (case-insensitive)
func (game *Game) IsNameTaken(name string) bool {
	game.PLock.RLock()         // Lock reads
	defer game.PLock.RUnlock() // Defer unlock reads
	for _, player := range game.Players {
		// Check if the names are equal (case-insensitive)
		if strings.EqualFold(player.Name, name) {
			return true
		}
	}
	return false
}

// Broadcast sends the provided packet to all the players in the game
func (game *Game) Broadcast(packet net.Packet) {
	game.PLock.RLock()
	for _, player := range game.Players {
		player.Net.Send(packet)
	}
	game.PLock.RUnlock()
}

// BroadcastExcluding sends the provided packet to all the players in the game
// excluding any players that match the excluded id
func (game *Game) BroadcastExcluding(exclude Identifier, packet net.Packet) {
	game.PLock.RLock()
	for id, player := range game.Players {
		if id != exclude {
			player.Net.Send(packet)
		}
	}
	game.PLock.RUnlock()
}

// Loop Run the game loop for the provided game
func (game *Game) Loop() {
	for {
		state := game.State

		if state == Stopped {
			break
		}
		time.Sleep(time.Second)
	}
}

// GetPlayer thread safe method for retrieving players from the game players list by ID
func (game *Game) GetPlayer(id string) *Player {
	game.PLock.RLock()
	player, exists := game.Players[id]
	if !exists {
		return nil
	}
	game.PLock.RUnlock()
	return player
}

// RemovePlayer Deletes the player from the players list. Made thread safe with PLock
func (game *Game) RemovePlayer(player *Player) {
	if game.State != Stopped {
		dataPacket := net.PlayerDataPacket(player.Id, player.Name, net.RemoveMode)
		game.BroadcastExcluding(player.Id, dataPacket)
		game.Host.Send(dataPacket)
		player.Net.Send(net.DisconnectPacket("Removed from game"))
	}
	game.PLock.Lock()
	delete(game.Players, player.Id)
	game.PLock.Unlock()
	log.Printf("Player '%s' (%s) removed from game '%s' (%s)", player.Name, player.Id, game.Title, game.Id)
}

// Stop Sets the game state to Stopped and calls RemovePlayer
// on all the players. Made thread safe with PLock
func (game *Game) Stop() {
	game.State = Stopped
	game.PLock.RLock()
	for _, player := range game.Players {
		game.RemovePlayer(player)
	}
	game.PLock.RUnlock()
	log.Printf("Stopping game '%s' (%s)", game.Title, game.Id)
}
