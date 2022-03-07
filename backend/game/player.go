package game

import (
	"backend/net"
	. "backend/tools"
	"github.com/jacobtread/gowsps"
	"sync"
	"time"
)

type (
	// Player A structure representing a player in the game
	Player struct {
		Net        *gowsps.Connection            // The connection to the player socket
		Id         Identifier                    // The unique ID of this player
		Name       string                        // The name of this player
		Score      uint32                        // The score this player has
		Answers    map[QuestionIndex]AnswerIndex // A map of the question index to the answer chosen
		AnswerTime time.Duration                 // The time of which the player provided its answer
	}

	// PlayerStore A structure for storing, retrieving, removing and overall
	// management of players for the game
	PlayerStore struct {
		Lock *sync.RWMutex          // A lock for ensuring that writes are synchronized
		Map  map[Identifier]*Player // The underlying map that stores the players mapped to Identifier's
	}
)

// NewPlayerStore Creates a new player store
func NewPlayerStore() PlayerStore {
	return PlayerStore{
		Lock: &sync.RWMutex{},
		Map:  map[Identifier]*Player{},
	}
}

// GetAnswer retrieves the player answer for the provided question index and
// returns both the value and weather it exists or not
func (player *Player) GetAnswer(index QuestionIndex) (AnswerIndex, bool) {
	// Retrieve the value
	answer, exists := player.Answers[index]
	return answer, exists
}

// HasAnswered Checks whether the player has already answered the current question
func (player *Player) HasAnswered(game *Game) bool {
	q := game.ActiveQuestion               // Retrieve the active question from the game
	_, contains := player.Answers[q.Index] // Retrieve the player answer
	return contains
}

// Answer sets the player answer to the provided answer index for the current quest
func (player *Player) Answer(game *Game, id AnswerIndex) {
	player.AnswerTime = Time()                       // Set the time of answer
	q := game.ActiveQuestion                         // Retrieve the active question from the game
	max := len(game.ActiveQuestion.Question.Answers) // Get the maximum question index
	if id >= max {                                   // If the provided answer is greater
		id = max - 1 // Set the answer to the last answer
	}
	// Set the index of the answer in the player answers map
	player.Answers[q.Index] = id
}

// CreatePlayerId Creates a new unique player identifier. Safely establishes read
// locks over the player map before accessing it
func (store *PlayerStore) CreatePlayerId() Identifier {
	store.Lock.RLock()         // Establish a read lock on the players map
	defer store.Lock.RUnlock() // Defer the releasing of the read lock
	for {                      // Infinitely loop until a unique Identifier is found
		id := CreateRandomId(6) // Create a random identifier
		_, contains := store.Map[id]
		if !contains { // Ensure the Identifier doesn't already exist
			return id // Return the identifier
		}
	}
}

// Create a new player and add it to the PlayerStore. Sends the player
// data of all other players in the game to that player and adds them to
// player map. Returns a pointer to the created player
func (store *PlayerStore) Create(conn *gowsps.Connection, name string) *Player {
	id := store.CreatePlayerId() // Create a unique player ID
	player := Player{
		Net:     conn,                            // Set the net connection
		Id:      id,                              // Set the unique id
		Name:    name,                            // Set the name
		Score:   0,                               // Initial score of zero
		Answers: map[QuestionIndex]AnswerIndex{}, // Empty answers map
	}

	// Iterate over all the players in the game
	store.ForEach(func(otherId Identifier, other *Player) {
		// Send the player the data for each other player in the game
		player.Net.Send(net.PlayerDataPacket(otherId, other.Name, net.AddMode))
	})

	store.Lock.Lock()       // Establish write lock over the players map
	store.Map[id] = &player // Set the identifier to the player pointer in the player map
	store.Lock.Unlock()     // Release write lock
	return &player          // Return the player pointer
}

// ForEach Runs the provided action on each player in the
// player map. Made concurrency safe by establishing and releasing.
// read locks before and after the function
func (store *PlayerStore) ForEach(action func(id Identifier, player *Player)) {
	store.Lock.RLock()                  // Establish a read lock on the players map
	for id, player := range store.Map { // Iterate over the players map
		action(id, player) // Run the action on the player
	}
	store.Lock.RUnlock() // Release the read lock
}

// GetPlayerArray Creates a copy of the players map values as an array. This is used
// in places where the players need to be iterated over and modified at the same time
func (store *PlayerStore) GetPlayerArray() []*Player {
	store.Lock.RLock()
	players := make([]*Player, len(store.Map)) // Create a new array of players
	i := 0                                     // The current index of the players array
	for _, player := range store.Map {         // Iterate over the players map
		players[i] = player // Set the key at the current index
		i++                 // Increment the current index
	}
	store.Lock.RUnlock()
	return players // Return the players array
}

// ForEachSafe a version of ForEach where the action will result in the modification
// of the underlying map such as removing a user. For this the users values are copied
// to an array before being iterated over
func (store *PlayerStore) ForEachSafe(action func(player *Player)) {
	players := store.GetPlayerArray() // Create a safe array copy of the player list
	for _, player := range players {  // Iterate over the players
		action(player) // Run the action on the player
	}
}

// AnyMatch Checks all the players to see if any match the passed
// condition function. Returns true if there was a player that matched
// the condition otherwise returns false
func (store *PlayerStore) AnyMatch(test func(player *Player) bool) bool {
	store.Lock.RLock()                 // Establish a read lock on the players map
	defer store.Lock.RUnlock()         // Defer the releasing of the read lock
	for _, player := range store.Map { // Iterate over the players map
		if test(player) { // If the test passed
			return true
		}
	}
	return false
}

// AllMatch Checks all the players to see if they all match the passed
// condition function. Returns true if all players match the condition
func (store *PlayerStore) AllMatch(test func(player *Player) bool) bool {
	store.Lock.RLock()                 // Establish a read lock on the players map
	defer store.Lock.RUnlock()         // Defer the releasing of the read lock
	for _, player := range store.Map { // Iterate over the players map
		if !test(player) { // If the test passed
			return false
		}
	}
	return true
}

// Get retrieves a pointer to player with a matching Identifier or nil if
// there are no players with that identifier. Concurrency safe because locks
// are established
func (store *PlayerStore) Get(id Identifier) *Player {
	store.Lock.RLock()              // Establish a read lock on the players map
	player, exists := store.Map[id] // Retrieve the value and exist state from the map
	store.Lock.RUnlock()            // Release the read lock
	if exists {                     // If the player exists
		return player // Return the player pointer
	} else {
		return nil
	}
}

// Remove Safely removes the player with the provided Identifier from the players
// map. This is concurrency safe because it uses locks
func (store *PlayerStore) Remove(id Identifier) {
	store.Lock.Lock() // Establish write lock on the players map
	delete(store.Map, id)
	store.Lock.Unlock() // Release write lock
}

// RemoveEach Runs the provided action on each player in the map
// while also removing them from the map. This is ensured to be
// concurrency safe as the players map is copied to an array before writing
func (store *PlayerStore) RemoveEach(action func(player *Player)) {
	store.Lock.Lock() // Establish write lock on the players map
	players := store.GetPlayerArray()
	for _, player := range players { // Loop over the keys
		action(player)
		delete(store.Map, player.Id) // Delete the key from the map
	}
	store.Lock.Unlock() // Release write lock
}

// CollectScores collects all the player scores into a map of the player
// Identifier to the score value. This is used for the score update packet
func (store *PlayerStore) CollectScores() ScoreMap {
	out := ScoreMap{}                                   // The store to return
	store.ForEach(func(id Identifier, player *Player) { // Iterate over the players
		out[id] = player.Score // Assign all the score values
	})
	return out
}
