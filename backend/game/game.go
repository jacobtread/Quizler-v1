package game

import (
	"log"
	"math/rand"
)

const (
	StartState = iota
	StopState
)

// Game A structure representing a game itself
// Title the title of this game room
// Questions The questions for this game
// Players
type Game struct {
	Id           string         `json:"id"`
	Title        string         `json:"title"`
	Questions    []QuestionData `json:"questions"`
	Players      []Player       `json:"players"`
	StateChannel chan int8
}

// Player A structure representing a player in the game
// Id The unique id to reference to this player
// Name The in game name of this player
// Score The current score this player has obtained
// Answers The answer the player gave to each question
type Player struct {
	Id      uint8            `json:"id"`
	Name    string           `json:"name"`
	Score   uint16           `json:"score"`
	Answers map[int16]string `json:"-"`
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

// CreateUniqueId Generates random ids with CreateRandomId until a unique id that is not
// present in the list of games is generated
func CreateUniqueId() string {
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
	id := CreateUniqueId()
	game := Game{
		Id:           id,
		Title:        title,
		Questions:    questions,
		Players:      []Player{},
		StateChannel: make(chan int8, 1),
	}

	go Loop(&game)

	Games[id] = game
	return &game
}

func Loop(game *Game) {
	var running = true
	log.Printf("Starting game loop for %s (%s)", game.Title, game.Id)
	for running {
		if <-game.StateChannel == StopState {
			log.Println("STOPPING")
			running = false
		}
		log.Printf("Running game loop for %s (%s)", game.Title, game.Id)
	}
}

func StopGame(id string) {
	game := GetGame(id)
	game.StateChannel <- StopState
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
