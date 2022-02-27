# Packet Reference

## Server

| Id   | Name              | Data                                                  | 
|------|-------------------|-------------------------------------------------------|
| 0x00 | DISCONNECT        | reason (string)                                       |
| 0x01 | ERROR             | cause (string)                                        |
| 0x02 | JOINED_GAME       | owner (bool), id (string) title (string)              |
| 0x03 | NAME_TAKEN_RESULT | result (bool)                                         |
| 0x04 | GAME_STATE        | state (uint8)                                         |
| 0x05 | PLAYER_DATA       | id (string), name (string), type (uint8)              |
| 0x06 | TIME_SYNC         | total (duration), remaining (duration)                |
| 0x07 | QUESTION          | image (string), question (string), answers (string[]) |
| 0x08 | ANSWER_RESULT     | result (bool)                                         |
| 0x09 | SCORES            | scores (map id->string)                               |

## Client

| Id   | Name               | Data                                       |
|------|--------------------|--------------------------------------------|
| 0x00 | DISCONNECT         |                                            |
| 0x01 | CREATE_GAME        | title (string), questions (QuestionData[]) |
| 0x02 | CHECK_NAME_TAKEN   | id (string), name (string)                 |
| 0x03 | REQUEST_GAME_STATE | id (string)                                |
| 0x04 | REQUEST_JOIN       | id (string), name (string)                 |
| 0x05 | START              |                                            |
| 0x06 | ANSWER             | id (uint16)                                |
| 0x07 | KICK               | id (string)                                |
| 0x08 | SKIP               |                                            |


    

