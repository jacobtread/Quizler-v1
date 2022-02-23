package game

import (
	"backend/net"
	. "backend/tools"
	. "backend/types"
	"log"
	"strings"
	"time"
)

// Enum for game states
const (
	Waiting      State = iota // Waiting for the game to start
	Starting                  // The game is about to start
	Started                   // The game is started an in progress
	Stopped                   // The game has Stopped and is ready to shut down
	DoesNotExist              // The game doesn't exist
)

// Game a structure representing the game itself
type Game struct {
	Host           *net.Connection // The connection to the game host
	Id             Identifier      // The unique identifier / game code for this game
	Title          string          // The title / name of this game
	Questions      []QuestionData  // An array of the questions for this game
	Players        PlayerStore     // The player store instance
	StartTime      time.Duration   // The system time in ms of when the game was created
	State          State           // The current state of the game
	ActiveQuestion *ActiveQuestion // The currently active question nil by default
}

// ActiveQuestion a structure representing the currently served question
type ActiveQuestion struct {
	Question  *QuestionData // The actual question itself
	Index     QuestionIndex // The index of this question in the array of questions
	StartTime time.Duration // The time that this question started at
	Marked    bool          // Whether the question has been marked
}

// Time Retrieves the current time in milliseconds
func Time() time.Duration {
	return time.Duration(time.Now().UnixNano())
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
func New(host *net.Connection, title string, questions []QuestionData) *Game {
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
	// Send the initial state of the game
	player.Net.Send(net.GameStatePacket(game.State))
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
func (game *Game) Broadcast(packet net.Packet, host bool) {
	// Iterate over all the players
	game.Players.ForEach(func(id Identifier, player *Player) {
		player.Net.Send(packet) // Send the packet to the player
	})
	if host { // If this packet should also be sent to the host
		// Send the host the packet as well
		game.Host.Send(packet)
	}
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

// Start Marks the game as Starting and begins the startup countdown and
// time sync on the client's
func (game *Game) Start() {
	log.Printf("Game '%s' (%s) moving into starting state", game.Title, game.Id)
	game.SetState(Starting)
	game.StartTime = Time()
}

const (
	StartDelay   = 10 * time.Second
	QuestionTime = 10 * time.Second
	SyncDelay    = 2 * time.Second
	MarkTime     = 3 * time.Second
)

// Loop Run the game loop for the provided game
func (game *Game) Loop() {
	// Set the last sync time to very long ago to make sure that
	// we will always sync the time straight away on the first go
	var lastTimeSync = time.Duration(0)

	for {
		state := game.State

		if state == Stopped { // If the game has stopped
			break // break from the game loop
		}

		t := Time()

		// The total time passed since the last time sync
		elapsedSinceSync := t - lastTimeSync

		if state == Starting { // If the game is starting
			// If two seconds has passed since the last time sync
			if elapsedSinceSync >= SyncDelay {
				lastTimeSync = t // Update the last time sync

				elapsedSinceStart := t - game.StartTime
				if elapsedSinceStart >= StartDelay { // If we have waited the full start delay duration
					game.SetState(Started) // Set the game as started
				} else {
					// Get the remaining time for the countdown
					remaining := StartDelay - elapsedSinceStart
					// Broadcast a time syncing packet to all clients including host
					game.Broadcast(net.TimeSyncPacket(StartDelay, remaining), true)
				}
			}
		}

		if state == Started { // If the game is started
			if game.ActiveQuestion == nil { // If we don't already have an active question
				game.NextQuestion() // Proceed to the next question
				lastTimeSync = -1   // Clear the last time sync so we sync straight away
			} else {
				elapsedSinceStart := t - game.ActiveQuestion.StartTime
				if elapsedSinceStart >= QuestionTime { // If we have passed the total question time
					if elapsedSinceStart >= QuestionTime+MarkTime { // If the marking time has also completed
						game.NextQuestion() // Move on to the next question
						lastTimeSync = -1   // Clear the last time sync so we sync straight away
					} else if !game.ActiveQuestion.Marked { // If the question hasn't been marked
						game.MarkQuestion(game.ActiveQuestion) // Mark the question
					}
				} else if elapsedSinceSync >= SyncDelay { // If the current time needs to be synced
					lastTimeSync = t                                                  // Update the last sync time
					remaining := QuestionTime - elapsedSinceStart                     // Calculate the
					game.Broadcast(net.TimeSyncPacket(QuestionTime, remaining), true) // Broadcast the time sync packet
				}
			}
		}

		// Sleep for one second after every iteration to not put
		// too much stress on the CPU
		time.Sleep(time.Second)
	}
}

// IsCorrect checks the correct answers for a question and checks if they match
// the provided answer index
func (question *ActiveQuestion) IsCorrect(answer AnswerIndex) bool {
	correctAnswers := question.Question.Values
	for _, value := range correctAnswers { // Iterate over the correct answers
		if value == answer { // If it matches
			return true // The answer is correct
		}
	}
	return false
}

// MarkQuestion Marks the question at the end of the
func (game *Game) MarkQuestion(question *ActiveQuestion) {
	log.Printf("Marking questions for game '%s' (%s)", game.Title, game.Id)
	game.Players.ForEach(func(id Identifier, player *Player) {
		// Retrieve the player answer
		answerIndex, answered := player.GetAnswer(question.Index)
		// Check the player answer
		correct := answered && question.IsCorrect(answerIndex)
		// Send the player their marking result
		player.Net.Send(net.AnswerResultPacket(correct))
	})
	// Set the question as marked
	question.Marked = true
}

// NextQuestion moves on to the next question and informs all the clients
// what the current question is
func (game *Game) NextQuestion() {
	t := Time() // Get the current time
	var nextIndex QuestionIndex
	if game.ActiveQuestion == nil { // If there isn't already an active question
		nextIndex = 0 // Set the next index to the first index
	} else { // Else
		nextIndex = game.ActiveQuestion.Index + 1 // Increase the index by 1
	}
	if nextIndex >= len(game.Questions) { // If the next index is higher than the amount of questions
		game.GameOver() // Game over
	} else {
		q := game.Questions[nextIndex] // Retrieve the next question
		game.ActiveQuestion = &ActiveQuestion{
			Question:  &q,
			Index:     nextIndex,
			StartTime: t,
			Marked:    false,
		}
		// Broadcast the question
		game.Broadcast(net.QuestionPacket(q), false)
	}
}

func (game *Game) GameOver() {
	log.Printf("Game over for game '%s' (%s)", game.Title, game.Id)
	game.SetState(Stopped)
}

// SetState sets the current game state and broadcasts the game state packet
// to inform all the clients of the game state change
func (game *Game) SetState(state State) {
	game.State = state
	game.Broadcast(net.GameStatePacket(state), true)
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
