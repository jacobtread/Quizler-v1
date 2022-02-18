package main

import (
	"github.com/gorilla/websocket"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"
)

type State = uint8

const (
	Waiting State = iota
	Started
	Stopped
	DoesNotExist
)

// Game A structure representing a game itself
// Title the title of this game room
// Questions The questions for this game
// Players
type Game struct {
	Host        *websocket.Conn   `json:"-"`
	Id          string            `json:"id"`
	Title       string            `json:"title"`
	Questions   []QuestionData    `json:"questions"`
	Players     map[string]Player `json:"players"`
	PlayersLock *sync.RWMutex     `json:"-"`
	Running     bool              `json:"running"`
	StartTime   time.Duration     `json:"start_time"`
	State       State             `json:"state"`
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
	Image    string   `json:"image"`
	Question string   `json:"question"`
	Answers  []string `json:"answers"`
	Values   []int8   `json:"values"`
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
func (game *Game) CreatePlayerId() string {
	for {
		id := CreateRandomId()
		_, contains := game.Players[id]
		if !contains {
			return id
		}
	}
}

// GetRandomGameId Generates random ids with CreateRandomId until a unique id that is not
// present in the list of games is generated
func GetRandomGameId() string {
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
func CreateGame(host *websocket.Conn, title string, questions []QuestionData) *Game {
	id := GetRandomGameId()
	game := Game{
		Host:        host,
		Id:          id,
		Title:       title,
		Questions:   questions,
		Players:     map[string]Player{},
		PlayersLock: &sync.RWMutex{},
		Running:     true,
		StartTime:   Time(),
		State:       Waiting,
	}

	go game.Loop()

	Games[id] = game
	return &game
}

func Time() time.Duration {
	return time.Duration(time.Now().UnixNano()) / time.Millisecond
}

func (game *Game) Loop() {
	log.Printf("Starting game loop for %s (%s)", game.Title, game.Id)
	for game.Running {
		t := Time()
		// duration := t - game.StartTime

		if game.State == Started || game.State == Waiting {
			// Process players remove any players that have been inactive for 10 seconds
			game.PlayersLock.RLock()
			for id, player := range game.Players {
				passTime := player.LastAlive - t
				if passTime >= 10*time.Second {
					game.RemovePlayer(id, "Player timed out")
				}
			}
			game.PlayersLock.RUnlock()
			if game.State == Started {

			}

		} else if game.State == Stopped {
			game.Stop()
		}

	}
}

func JoinGame(name string, conn *websocket.Conn, game *Game) *Player {
	id := game.CreatePlayerId()
	player := Player{
		Id:        id,
		Name:      name,
		Score:     0,
		Answers:   map[int16]string{},
		LastAlive: Time(),
		Connect:   conn,
	}
	log.Printf("Player '%s' joined game '%s' given id '%s'", player.Name, game.Id, player.Id)

	game.PlayersLock.RLock()
	for i, p := range game.Players {
		player.Send(GetPlayerDataPacket(i, p.Name))
	}
	game.BroadcastPacketExcluding(id, GetPlayerDataPacket(id, name))
	game.SendHost(GetPlayerDataPacket(id, name))
	game.PlayersLock.RUnlock()

	game.PlayersLock.Lock()
	game.Players[id] = player
	game.PlayersLock.Unlock()

	return &player
}

func (game *Game) SendHost(packet Packet) {
	log.Printf("Sending packet to host %d", packet.Id)
	err := game.Host.WriteJSON(packet)
	if err != nil {
		log.Printf("Failed to send packet to host of '%s'", game.Id)
	}
}

func HandlePacket(game *Game, player *Player, id PacketId, data map[string]interface{}) {
	if game.State == Started {
		switch id {
		case AnswerId:

		}
	}
}

func (player *Player) Send(packet Packet) {
	err := player.Connect.WriteJSON(packet)
	if err != nil {
		log.Printf("Failed to send packet to player '%s' (%s)", player.Name, player.Id)
	}
}

func (game *Game) BroadcastPacket(packet Packet) {
	game.PlayersLock.RLock()
	for _, player := range game.Players {
		player.Send(packet)
	}
	game.PlayersLock.RUnlock()
}

func (game *Game) BroadcastPacketExcluding(exclude string, packet Packet) {
	game.PlayersLock.RLock()
	for id, player := range game.Players {
		if id != exclude {
			player.Send(packet)
		}
	}
	game.PlayersLock.RUnlock()
}

func (game *Game) RemovePlayer(id string, reason string) {
	game.PlayersLock.RLock()
	player := game.Players[id]
	player.Connect.Close()
	game.PlayersLock.Lock()
	delete(game.Players, id)
	game.PlayersLock.Unlock()
	game.PlayersLock.RUnlock()
	game.BroadcastPacketExcluding(id, GetDisconnectOtherPacket(id, reason))
}

func (game *Game) Stop() {
	game.Running = false
	game.PlayersLock.RLock()
	for id := range game.Players {
		game.RemovePlayer(id, "Id ended")
	}
	game.PlayersLock.RUnlock()
	log.Printf("Stopping game %s", game.Id)
}

func (game *Game) IsNameTaken(name string) bool {
	game.PlayersLock.RLock()
	for _, player := range game.Players {
		if strings.ToLower(player.Name) == strings.ToLower(name) {
			return true
		}
	}
	game.PlayersLock.RUnlock()
	return false
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
