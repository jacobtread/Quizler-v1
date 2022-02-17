# Packet Reference

| Id (Hex) | Name             | Description                                                                      |
|----------|------------------|----------------------------------------------------------------------------------|
| 0x00     | Unknown          | Describes a packet without any known data. Used for unfilled packets             |
| 0x01     | Keep Alive       | Packet used to keep the connection alive between the client and server           |
| 0x02     | Disconnect       | Send by the client or server when either one disconnects or becomes disconnected |
| 0x03     | Error            | Describes an error that occurred on the server                                   |
| 0x04     | Create Game      | Creates a new game                                                               |
| 0x05     | Request Join     | Attempts to join a game                                                          |
| 0x06     | Join Game        | Sent to the player to tell them they joined contains server info                 |
| 0x07     | Player Data      | Contains information about other players                                         |
| 0x08     | Game State       | Contains information about the current game "state"                              |
| 0x09     | Question         | Contains the current question being asked                                        |
| 0x0A     | Answer           | Contains the answer to the current question                                      |
| 0x0B     | Time             | Contains the remaining time for the question                                     |
| 0x0C     | Winners          | Contains the information for those with the highest scores for game over         |
| 0x0D     | Disconnect Other | Contains the information for those with the highest scores for game over         |
| 0x0E     | Destroy          | Destroys the game created by the owner                                           |
