package game

import (
	"backend/net"
	"github.com/gorilla/websocket"
	"log"
	"math/rand"
	"time"
)

// Game A structure representing a game itself
// Title the title of this game room
// Questions The questions for this game
// Players
type Game struct {
	Id        string            `json:"id"`
	Title     string            `json:"title"`
	Questions []QuestionData    `json:"questions"`
	Players   map[string]Player `json:"players"`
	Running   bool              `json:"running"`
	StartTime time.Duration     `json:"start_time"`
}

// Player A structure representing a player in the game
// Id The unique id to reference to this player
// Name The in game name of this player
// Score The current score this player has obtained
// Answers The answer the player gave to each question
type Player struct {
	Id        string           `json:"id"`
	Name      string           `json:"name"`
	Score     uint16           `json:"score"`
	Answers   map[int16]string `json:"-"`
	LastAlive time.Duration    `json:"last_alive"`
	Connect   *websocket.Conn  `json:"-"`
}

// QuestionData A structure representing a question in the game
// Title the title for this
// Question the actual question that the player should be asked
// Answers The list of possible answers for this question
// Answer The correct answer for this question
type QuestionData struct {
	Title    string   `json:"title"`
	Question string   `json:"question"`
	Answers  []string `json:"answers"`
	Answer   int16    `json:"answer"`
}

// UniqueIdLength The length in chars that should be used for generating unique game ids
const UniqueIdLength = 5

// Games A map of unique game ids to the game objects
var Games = map[string]Game{}

// CreateRandomId Generates a random id string using the uppercase chars from A - F and
// the numbers from 0 to 9
func CreateRandomId() string {
	chars := []rune("ABCDEF0123456789")
	id := make([]rune, UniqueIdLength)
	for i := range id {
		id[i] = chars[rand.Intn(len(chars))]
	}
	return string(id)
}

// CreatePlayerId Generate a random id for a player
func CreatePlayerId(game *Game) string {
	for {
		id := CreateRandomId()
		_, contains := game.Players[id]
		if !contains {
			return id
		}
	}
}

// CreateGameId Generates random ids with CreateRandomId until a unique id that is not
// present in the list of games is generated
func CreateGameId() string {
	for {
		id := CreateRandomId()
		_, contains := Games[id]
		if !contains {
			return id
		}
	}
}

// CreateGame creates a new game with the provided title and questions,
// assigns it a unique id, stores it and returns the id and the game
func CreateGame(title string, questions []QuestionData) *Game {
	id := CreateGameId()
	game := Game{
		Id:        id,
		Title:     title,
		Questions: questions,
		Players:   map[string]Player{},
		Running:   true,
		StartTime: Time(),
	}

	go Loop(&game)

	Games[id] = game
	return &game
}

func Time() time.Duration {
	return time.Duration(time.Now().UnixNano()) / time.Millisecond
}

func Loop(game *Game) {
	log.Printf("Starting game loop for %s (%s)", game.Title, game.Id)
	for game.Running {
		t := Time()
		duration := t - game.StartTime

		log.Printf("Running game loop for %s (%s) been alive for %d", game.Title, game.Id, duration/time.Millisecond)

		for id, player := range game.Players {
			passTime := player.LastAlive - t
			if passTime >= 10*time.Second {
				RemovePlayer(game, id, "Player timed out")
			}
		}
	}
}

func JoinGame(name string, conn *websocket.Conn, game *Game) {
	id := CreatePlayerId(game)
	player := Player{
		Id:        id,
		Name:      name,
		Score:     0,
		Answers:   map[int16]string{},
		LastAlive: Time(),
		Connect:   conn,
	}
	game.Players[id] = player
	BroadcastPacketExcluding(id, game, net.GetDisconnectOtherPacket(id, name))
}

func SendPacket(player *Player, packet net.Packet) {
	err := player.Connect.WriteJSON(packet)
	if err != nil {
		log.Printf("Failed to send packet to player '%s' (%s)", player.Name, player.Id)
	}
}

func BroadcastPacket(game *Game, packet net.Packet) {
	for _, player := range game.Players {
		SendPacket(&player, packet)
	}
}

func BroadcastPacketExcluding(exclude string, game *Game, packet net.Packet) {
	for id, player := range game.Players {
		if id != exclude {
			SendPacket(&player, packet)
		}
	}
}

func RemovePlayer(game *Game, id string, reason string) {
	player := game.Players[id]
	player.Connect.Close()
	delete(game.Players, id)
	BroadcastPacketExcluding(id, game, net.GetDisconnectOtherPacket(id, reason))
}

func StopGame(id string) {
	game := GetGame(id)
	game.Running = false
	for id := range game.Players {
		RemovePlayer(game, id, "Game ended")
	}
	log.Printf("Stopping game %s", id)
}

// GetGame retrieves the game with the matching id from the games
// list and returns it or nil if not present
func GetGame(id string) *Game {
	game, contains := Games[id]
	if !contains {
		return nil
	}
	return &game
}
