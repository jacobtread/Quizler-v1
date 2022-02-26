import packets, {
    DisconnectData,
    ErrorData,
    GameData,
    GameStateData,
    Packet,
    PlayerData,
    PlayerDataP,
    QuestionData,
    TimeSyncData
} from "./packets";
import { onUnmounted, reactive, ref, Ref } from "vue";
import { dialog, toast } from "@/events";

export const APP_HOST: string = import.meta.env.VITE_HOST

/**
 * Converts the provided value to a hex string representation
 * that must fit the length provided in padding
 *
 * @param value
 * @param padding
 */
function toHex(value: number, padding: number = 2) {
    let hexString = value.toString(16)
    while (hexString.length < padding) {
        hexString = '0' + hexString
    }
    return '0x' + hexString
}

interface PacketHandlers {
    [id: number]: (api: SocketApi, data: any) => void
}

export enum GameState {
    UNSET = -1,
    WAITING,
    STARTING,
    STARTED,
    STOPPED,
    DOES_NOT_EXIST,

}

export interface PlayerMap {
    [name: string]: PlayerData
}

enum Direction {
    IN,
    OUT
}

const EMPTY_HANDLER = () => {
}


/**
 * Stores all logic for communicating between the client and server over the
 * websocket connection.
 */
class SocketApi {

    // The websocket connection instance
    private ws: WebSocket = this.connect()

    // Whether the main update loop is running
    private isRunning: boolean = true
    // Whether debug logging should be enabled
    private isDebug: boolean = true
    // Whether to hide keep alive packets from the debug log
    private isDebugHideKeepAlive: boolean = true


    // The interval timer handle used to cancel the update interval
    private updateInterval: any = undefined

    // The last time a server keep alive response was received
    private lastServerKeepAlive: number = -1
    // The last time that this client sent a keep alive at
    private lastSendKeepAlive: number = -1

    open = ref(false) // The open state of the web socket connection
    gameData = ref<GameData | null>(null) // The current game data
    players = reactive<PlayerMap>({}) // The map of players to their names
    question = ref<QuestionData | null>(null) // The active question in the game (store here to persist)
    gameState = ref<GameState>(GameState.UNSET) // The current game state


    /**
     * A mapping to convert the packet ids into handler functions so that
     * they can be handled separately instead of a large switch statement
     */
    private handlers: PacketHandlers = {
        0x00: this.onKeepAlive,
        0x01: this.onDisconnect,
        0x02: this.onError,
        0x03: this.onJoinGame,
        0x04: EMPTY_HANDLER, // NAME TAKEN RESULT PACKET
        0x05: this.onGameState,
        0x06: this.onPlayerData,
        0x07: EMPTY_HANDLER, // TIME SYNC PACKET
        0x08: this.onQuestion,
        0x09: EMPTY_HANDLER, // ANSWER RESULT PACKET
        0x0A: EMPTY_HANDLER, // SCORES PACKET
    }

    setHandler<V>(id: number, handle: (data: V) => any) {
        this.handlers[id] = (api: SocketApi, data: V) => handle(data)
    }

    clearHandler(id: number) {
        this.handlers[id] = EMPTY_HANDLER
    }

    /**
     * Creates a connection to the websocket at APP_HOST and returns the websocket
     * all the listeners are added to the websocket and the update interval is set
     */
    connect(): WebSocket {
        const ws = new WebSocket(APP_HOST)
        ws.onopen = () => this.onOpened()
        ws.onmessage = (e) => this.onMessage(e)
        ws.onclose = () => this.onClose()
        ws.onerror = (e: Event) => {
            console.error(e)
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
        }
        this.updateInterval = setInterval(() => this.update(), 100)
        return ws
    }

    /**
     * Called when the websocket connection is created and open
     * if the ready state of the web socket is OPEN then isOpen
     * will be set to true allowing the update loop to start
     */
    onOpened() {
        console.log('Connected')
        if (this.ws.readyState != WebSocket.OPEN) return
        this.lastServerKeepAlive = performance.now()
        this.open.value = true
    }

    /**
     * Called when the web socket connection is closed
     */
    onClose() {
        this.open.value = false
        if (this.isRunning) {
            this.retryConnect()
        } else {
            console.log('Disconnected')
            this.disconnect()
        }
    }

    /**
     * Retries connecting to the websocket server in 2 seconds and resets the
     * game state
     */
    retryConnect() {
        this.open.value = false
        console.log('Lost connection. Attempting reconnect in 2 seconds')
        const api = this
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
        }
        setTimeout(() => api.ws = api.connect(), 2000)
    }

    /**
     * Called when a websocket message is received this function handles the
     * mapping of packets to packet handlers as well as parsing and error checking
     *
     * @param event The message event
     */
    onMessage(event: MessageEvent) {
        try {
            const packet = JSON.parse(event.data) as Packet<any>
            const id: number = packet.id
            const data: any = packet.data
            // Check to make sure we have a handler for this packet id
            if (id in this.handlers) {
                this.debugPacket(Direction.IN, packet)
                const handler = this.handlers[id]
                // Call the packet handler with this and the packet data
                handler(this, data)
            } else {
                console.warn(`Don't know how to handle packet with id (${id.toString(16)})`)
            }
        } catch (e) {
            console.error(e)
        }
    }

    /**
     * Packet handler for PlayerData packet (0x07) handles data about other
     * players in the game such as username and id's
     *
     * @param api The current connection instance
     * @param data The player data of the other player
     */
    onPlayerData(api: SocketApi, data: PlayerDataP) {
        const elm = {id: data.id, name: data.name}
        if (data.mode === 0) {
            api.players[data.id] = elm
        } else if (data.mode === 1) {
            delete api.players[data.id]
        }
    }

    /**
     * Packet handler for GameState packet (0x05) handles keeping track
     * of the games state
     *
     * @param api The current connection instance
     * @param data The current game state
     */
    onGameState(api: SocketApi, data: GameStateData) {
        api.gameState.value = SocketApi.getGameState(data.state)
    }

    /**
     * Packet handler for Question packet (0x08) which provides each
     * client with the current question to answer
     *
     * @param api The current connection instance
     * @param question The current question
     */
    onQuestion(api: SocketApi, question: QuestionData) {
        api.question.value = question
    }

    /**
     * Converts the game state id into the game
     * state enum value
     *
     * @param id The id of the game state
     * @return The game state enum
     */
    static getGameState(id: number): GameState {
        if (id == 0) {
            return GameState.WAITING
        } else if (id == 1) {
            return GameState.STARTING
        } else if (id == 2) {
            return GameState.STARTED
        } else if (id == 3) {
            return GameState.STOPPED
        } else {
            return GameState.DOES_NOT_EXIST
        }
    }

    /**
     * Packet handler for the Disconnect packet (0x02) handles the player
     * being disconnected from the game
     *
     * @param api The current connection instance
     * @param data The disconnect data contains the reason for disconnect
     */
    onDisconnect(api: SocketApi, data: DisconnectData) {
        dialog('Disconnected', data.reason)
        api.setGameData(null)
    }

    /**
     * Packet handler for the KeepAlive packet (0x01) handles updating the
     * lastServerKeepAlive time ensuring that the server is still alive
     *
     * @param api The current connection instance
     */
    onKeepAlive(api: SocketApi) {
        api.lastServerKeepAlive = performance.now()
    }

    /**
     * Packet handler for the Error packet (0x03) handles errors that should
     * be displayed to the client. TODO: Display this to the client
     *
     * @param api The current connection instance
     * @param data The data for the error packet contains the error cause
     */
    onError(api: SocketApi, data: ErrorData) {
        console.error(`An error occurred ${data.cause}`)
        dialog('Error occurred', data.cause)
    }

    /**
     * Packet handler for the Join Game packet (0x06) handles the player
     * joining the game. Sets the game code and emits relevant events
     *
     * @param api The current connection instance
     * @param data The data for the game contains the id and title
     */
    onJoinGame(api: SocketApi, data: GameData) {
        api.setGameData(data)
    }

    /**
     * Debug logs information about the provided packet
     *
     * @param dir The direction the packet is going IN for inbound OUT for outbound
     * @param packet The packet to print debug info about
     */
    debugPacket(dir: Direction, packet: Packet<any>) {
        if (this.isDebug) { // Ensure that this only happens in debug mode
            const id = packet.id
            if (this.isDebugHideKeepAlive && id === 0x00) {
                return
            }
            let name = packets.names[dir][id] // Retrieve debug friendly packet name
            if (!name) name = 'Unknown Name'
            let dirName = dir == 0 ? '<-' : '->'

            if (packet.data !== undefined) {
                const dataString = JSON.stringify(packet.data)
                console.debug(`[${dirName}] ${name} (${toHex(id, 2)}) ${dataString}`)
            } else {
                console.debug(`[${dirName}] ${name} (${toHex(id, 2)})`)
            }
        }
    }

    /**
     * Serializes the packet to json and sends it to the ws server.
     * Logs the packet to debug if isDebug is enabled
     *
     * @param packet The packet to send
     */
    send(packet: Packet<any>) {
        this.debugPacket(Direction.OUT, packet)
        this.ws.send(JSON.stringify(packet))
    }

    /**
     * Keeps alive the connection by sending a Keep Alive packet to
     * the server. This is called every 1000ms
     */
    keepAlive() {
        this.lastSendKeepAlive = performance.now()
        this.send(packets.keepAlive())
    }

    /**
     * Set's the current game code
     *
     * @param data The data or null to clear the game code .
     */
    setGameData(data: GameData | null) {
        this.gameData.value = data
    }

    /**
     * Called when the client should disconnect from the server. Clears the
     * update interval along with stopping the running loop and if the ws
     * connection is open according to isOpen then it will be closed as well
     */
    disconnect() {
        console.log('Disconnected from game')
        this.setGameData(null)
        this.send(packets.disconnect())
    }

    /**
     * Removes a player from the game (HOST ONLY)
     *
     * @param id The id of the player to kick
     */
    kick(id: string) {
        const player = this.players[id]
        if (player) {
            toast(`Kicked player "${player.name}"`)
        }
        console.log('Kicked player ' + id)
        delete this.players[id]
        this.send(packets.kick(id))
    }

    /**
     * An update loop. This runs constantly as long as disconnect is not
     * called. Currently, this just handles keeping the connection alive
     * and checking if the connection has timed out
     */
    update() {
        if (this.isRunning && this.open.value) {
            const time = performance.now()
            if (time - this.lastServerKeepAlive > 10000) {
                this.retryConnect()
                return
            }

            if (time - this.lastSendKeepAlive > 1000) {
                this.keepAlive()
            }
        }
    }
}

// The socket instance
let socket: SocketApi

/**
 * A function for using the socket connection. Will create a new
 * socket connection if there isn't already one
 */
export function useSocket(): SocketApi {
    // If we don't have a socket instance create a new one
    if (!socket) socket = new SocketApi()
    return socket
}

/**
 * Creates a timer reactive reference value which is linked to and updated by
 * the server synced time packets. This time will count down on its own
 * automatically but will always trust server time sync over its own time
 *
 * @param socket The socket instance to use synced time from
 * @param initialValue The initial time value to count from until time is synced
 */
export function useSyncedTimer(socket: SocketApi, initialValue: number): Ref<number> {
    // The actual value itself that should be displayed
    const value = ref<number>(initialValue)

    // Stores the last time in milliseconds that the counter ran a countdown animation
    let lastUpdateTime: number = -1

    /**
     * Handles time sync packets (0x07) and updates
     * the current time based on that
     *
     * @param data The time sync packet data
     */
    function onTimeSync(data: TimeSyncData) {
        // Convert the remaining time to seconds and ceil it
        value.value = Math.ceil(data.remaining / 1000)
        // Set the last update time = now to prevent it updating again
        // and causing an accidental out of sync
        lastUpdateTime = performance.now()
    }

    /**
     * Run on browser animation frames used to update the time and count
     * down the timer every second. This is used to continue counting
     * so that the server doesn't have to send a large volume of time
     * updates and can instead send only a few every couple of second's
     * to sync up the times
     */
    function update() {
        // The value should not be changed if It's going to be < 0
        if (value.value - 1 >= 0) {
            const time = performance.now() // Retrieve the current time
            const elapsed = time - lastUpdateTime // Calculate the time passed since last update
            if (elapsed >= 1000) { // If 1 second has passed since the last update
                lastUpdateTime = time // Set the last update time
                value.value-- // Decrease the countdown value
            }
        }
        // Request the next animation frame
        requestAnimationFrame(update)
    }

    update() // Trigger the update function to start the animation loop

    // Use onTimeSync as the packet handler for time sync packets
    socket.setHandler(0x07, onTimeSync);

    // Clear the time sync packet handler on unmount
    onUnmounted(() => socket.clearHandler(0x07))
    return value
}