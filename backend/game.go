package main

type Game struct {
	Title     string         `json:"title"`
	Questions []QuestionData `json:"questions"`
	Players   []Player       `json:"players"`
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
	Answers map[int16]string `json:"answers"`
}

type QuestionData struct {
	Id       int16    `json:"id"`
	Title    string   `json:"title"`
	Question string   `json:"question"`
	Answers  []string `json:"answers"`
	Answer   int16    `json:"answer"`
}

var Games = map[string]Game{}

func CreateGame(title string, questions []QuestionData) {

}
