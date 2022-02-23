package tools

import "math/rand"

// Identifier represents a unique identifier
type Identifier = string

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
