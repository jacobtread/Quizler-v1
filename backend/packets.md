# Packet Reference

| Id (Hex) | Name        | Description                                                                      |
|----------|-------------|----------------------------------------------------------------------------------|
| 0x00     | Unknown     | Describes a packet without any known data. Used for unfilled packets             |
| 0x01     | Keep Alive  | Packet used to keep the connection alive between the client and server           |
| 0x02     | Disconnect  | Send by the client or server when either one disconnects or becomes disconnected |
| 0x03     | Error       | Describes an error that occurred on the server                                   |
| 0x04     | Create Game | Creates a new game                                                               |
