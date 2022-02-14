package main

import (
	"backend/game"
	"backend/net"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"log"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	r.GET("/ws", net.SocketConnect)
	r.Use(static.Serve("/", static.LocalFile("./public", true)))

	game.CreateGame("Yes", []game.QuestionData{})

	err := r.Run()
	if err != nil {
		log.Fatal("An error occurred", err)
	}
}
