package main

import (
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	r.GET("/ws", SocketAPI)
	r.Use(static.Serve("/", static.LocalFile("./public", true)))

	err := r.Run()
	if err != nil {
		log.Fatal("An error occurred", err)
	}
}

type JoinGame struct {
	Id      string   `json:"id"`
	Name    string   `json:"name"`
	Players []Player `json:"players"`
}

type Player struct {
	Id    string `json:"id"`
	Name  string `json:"name"`
	Score int16  `json:"score"`
}

type Command struct {
	Id   int16       `json:"id"`
	Name string      `json:"name"`
	Data interface{} `json:"data"`
}

func SocketAPI(c *gin.Context) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Fatal("Failed to handle connection", err)
	}
	defer func(ws *websocket.Conn) {
		err := ws.Close()
		if err != nil {
			log.Fatal("Error when closing websocket", err)
		}
	}(ws)
	var command = Command{Name: "", Data: nil}
	err = ws.ReadJSON(&command)
	if err != nil {
		log.Fatal("Error when reading message", err)
	}
	log.Println(command)
}
