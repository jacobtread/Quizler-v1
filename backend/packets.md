# Packet Reference

## Server

| Id   | Name              | Data                                                  | 
|------|-------------------|-------------------------------------------------------|
| 0x00 | KEEP_ALIVE        |                                                       |
| 0x01 | DISCONNECT        | reason (string)                                       |
| 0x02 | ERROR             | cause (string)                                        |
| 0x03 | JOINED_GAME       | owner (bool), id (string) title (string)              |
| 0x04 | NAME_TAKEN_RESULT | result (bool)                                         |
| 0x05 | GAME_STATE        | state (uint8)                                         |
| 0x06 | PLAYER_DATA       | id (string), name (string), type (uint8)              |
| 0x07 | QUESTION          | image (string), question (string), answers (string[]) |
| 0x08 | TIME_SYNC         | total (duration), remaining (duration)                |
| 0x09 | GAME_OVER         | (NOT_DEFINED_YET)                                     |

## Client

| Id   | Name               | Data                                       |
|------|--------------------|--------------------------------------------|
| 0x00 | KEEP_ALIVE         |                                            |
| 0x01 | DISCONNECT         |                                            |
| 0x02 | CREATE_GAME        | title (string), questions (QuestionData[]) |
| 0x03 | CHECK_NAME_TAKEN   | id (string), name (string)                 |
| 0x04 | REQUEST_GAME_STATE | id (string)                                |
| 0x05 | REQUEST_JOIN       | id (string), name (string)                 |
| 0x06 | ANSWER             | id (uint16)                                |
| 0x07 | KICK               | id (string)                                |


    

