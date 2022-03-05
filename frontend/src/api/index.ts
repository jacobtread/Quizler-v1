import packets, {
    debugLogPacket,
    Direction,
    DisconnectData,
    ErrorData,
    GameData,
    GameStateData,
    Packet,
    PlayerData,
    PlayerDataMode,
    PlayerDataWithMode,
    QuestionData,
    ScoresData,
    SPID,
    States,
    TimeSyncData
} from "./packets";
import { onUnmounted, reactive, ref, Ref, watch } from "vue";
import { dialog, toast } from "@/tools/ui";
import { DEBUG, HOST } from "@/constants";
import { router } from "@/router";
import { useRouter } from "vue-router";

// An enum for all the different possible game states
export enum GameState {
    UNSET = -1,
    WAITING,
    STARTING,
    STARTED,
    STOPPED,
    DOES_NOT_EXIST,
}

// Defines a map of id -> player data
type PlayerMap = Record<string, PlayerData>

// An empty function for handlers without a function
const EMPTY_HANDLER = () => null

// Defines the type of packet handler function
type PacketHandlerFunction = (data: any) => void
// Defines the packet handlers map which is id -> handler
type PacketHandlers = Record<SPID, PacketHandlerFunction>

/**
 * Stores all logic for communicating between the client and server over the
 * websocket connection.
 */
export class SocketApi {

    // The websocket connection instance
    private ws: WebSocket
    private readonly host: string

    open = ref(false) // The open state of the web socket connection
    gameData = ref<GameData | null>(null) // The current game data
    players = reactive<PlayerMap>({}) // The map of players to their names
    question = ref<QuestionData | null>(null) // The active question in the game (store here to persist)
    gameState = ref<GameState>(GameState.UNSET) // The current game state
    self = ref<PlayerData | null>(null) // The player we are playing as

    /**
     * A mapping to convert the packet ids into handler functions so that
     * they can be handled separately instead of a large switch statement
     */
    handlers: PacketHandlers = {
        [SPID.DISCONNECT]: this.onDisconnect.bind(this),
        [SPID.ERROR]: this.onError.bind(this),
        [SPID.JOIN_GAME]: this.onJoinGame.bind(this),
        [SPID.NAME_TAKEN_RESULT]: EMPTY_HANDLER,
        [SPID.GAME_STATE]: this.onGameState.bind(this),
        [SPID.PLAYER_DATA]: this.onPlayerData.bind(this),
        [SPID.TIME_SYNC]: EMPTY_HANDLER,
        [SPID.QUESTION]: this.onQuestion.bind(this),
        [SPID.ANSWER_RESULT]: EMPTY_HANDLER,
        [SPID.SCORES]: this.onScores.bind(this),
    }

    /**
     * Creates a new socket instance
     *
     * @param host The websocket server host address
     */
    constructor(host: string) {
        this.host = host
        this.ws = this.connect(host)
    }

    /**
     * Creates a connection to the websocket at APP_HOST and returns the websocket
     * all the listeners are added to the websocket and the update interval is set
     */
    connect(host: string): WebSocket {
        const ws = new WebSocket(host) // Create a new web socket instance
        // Set the handler for the websocket open event
        ws.onopen = () => {
            if (DEBUG) console.debug('Connected to socket server') // Debug logging
            if (this.ws.readyState != WebSocket.OPEN) return // Ensure we are actually on the open ready state
            this.open.value = true // Update the open state
        }
        // Set the handler for the websocket message event
        ws.onmessage = (event: MessageEvent) => {
            try {
                const packet = JSON.parse(event.data) as Packet // Parse the packet
                debugLogPacket(Direction.IN, packet) // Debug print the packet info
                const id: SPID = packet.id // Get the packet id
                const data: any = packet.data
                if (id in this.handlers) {  // Check to make sure we have a handler for this packet id
                    const handler = this.handlers[id] // Retrieve the packet handler
                    handler(data) // Invoke the packet handler
                } else {
                    // Send a warning to the console saying that there's no handler
                    console.warn(`Don't know how to handle packet with id (${id.toString(16)})`)
                }
            } catch (e) {
                console.error(e)
            }
        }
        // Set the handler for the websocket close event
        ws.onclose = () => {
            this.open.value = false // Update the open state
            this.retryConnect() // Try and reconnect to the server
        }
        ws.onerror = console.error // Directly print all errors to the console
        return ws
    }

    /**
     * Retries connecting to the websocket server in 2 seconds and resets the
     * game state
     */
    retryConnect() {
        if (this.open.value) { // If the connection is open
            this.ws.close() // Close the connection
            this.open.value = false // Set the open state
        }
        // Print a debug message saying the connection was lost
        console.debug('Lost connection. Attempting reconnect in 2 seconds')
        // Set a timeout to try and connect again in 2s
        setTimeout(() => this.ws = this.connect(this.host), 2000)
    }

    /**
     * Packet handler for PlayerData packet (0x07) handles data about other
     * players in the game such as username and id's
     *
     * @param data The player data of the other player
     */
    onPlayerData(data: PlayerDataWithMode) {
        // Create a copy of the player data without the mode and a score of 0
        const elm: PlayerData = {id: data.id, name: data.name, score: 0}
        if (data.mode === PlayerDataMode.ADD || data.mode === PlayerDataMode.SELF) { // If the mode is ADD or SELF
            this.players[data.id] = elm // Assign the ID in the player map
            if (data.mode === PlayerDataMode.SELF) { // If the mode is SELF
                this.self.value = elm // Set the self player to the player data
            }
        } else if (data.mode === PlayerDataMode.REMOVE) { // if the mode is REMOVE
            delete this.players[data.id] // Remove the ID from the player map
        }
    }

    /**
     * Packet handler for Scores packet (0x0A) handles the data about
     * the scores of each player in the game.
     * *
     * @param data The score data
     */
    onScores(data: ScoresData) {
        for (let dataKey in data.scores) {
            const player = this.players[dataKey]
            if (player) {
                player.score = data.scores[dataKey]
            }
        }
    }


    /**
     * Packet handler for GameState packet (0x05) handles keeping track
     * of the games state
     *
     * @param data The current game state
     */
    onGameState(data: GameStateData) {
        this.gameState.value = data.state // Set the game state
    }

    /**
     * Packet handler for Question packet (0x08) which provides each
     * client with the current question to answer
     *
     * @param question The current question
     */
    onQuestion(question: QuestionData) {
        this.question.value = question // Set the question value
    }

    /**
     * Packet handler for the Disconnect packet (0x02) handles the player
     * being disconnected from the game
     *
     * @param data The disconnect data contains the reason for disconnect
     */
    onDisconnect(data: DisconnectData) {
        if (this.gameState.value !== GameState.STOPPED) {
            dialog('Disconnected', data.reason) // Display a disconnected dialog with the reason
        }
        this.resetState()
        router.push({name: 'Home'}).then().catch()
    }

    /**
     * Clears the associated persisted state for this socket
     */
    resetState() {
        this.self.value = null
        this.gameData.value = null
        this.question.value = null
        this.gameState.value = GameState.UNSET
        for (let key of Object.keys(this.players)) {
            delete this.players[key]
        }
    }

    /**
     * Packet handler for the Error packet (0x03) handles errors that should
     * be displayed to the client.
     *
     * @param data The data for the error packet contains the error cause
     */
    onError(data: ErrorData) {
        console.error(`An error occurred ${data.cause}`) // Print the error to the console
        dialog('Error occurred', data.cause) // Display an error dialog
    }

    /**
     * Packet handler for the Join Game packet (0x06) handles the player
     * joining the game. Sets the game code and emits relevant events
     *
     * @param data The data for the game contains the id and title
     */
    onJoinGame(data: GameData) {
        // Set the game data to the provided value
        this.gameData.value = data
        this.gameState.value = GameState.WAITING
    }

    /**
     * Serializes the packet to json and sends it to the ws server.
     * Logs the packet to debug if isDebug is enabled
     *
     * @param packet The packet to send
     */
    send(packet: Packet) {
        debugLogPacket(Direction.OUT, packet) // Debug log the packet
        this.ws.send(JSON.stringify(packet)) // Send json encoded packet data
    }

    /**
     * Called when the client should disconnect from the server. Clears the
     * update interval along with stopping the running loop and if the ws
     * connection is open according to isOpen then it will be closed as well
     */
    disconnect() {
        if (DEBUG) console.debug('Disconnected from game') // Print debug disconnected message
        this.send(packets.stateChange(States.DISCONNECT)) // Send a disconnect packet
        this.resetState()
    }

    /**
     * Removes a player from the game (HOST ONLY)
     *
     * @param id The id of the player to kick
     */
    kick(id: string) {
        const player = this.players[id]
        if (player) { // If the player exists
            // Displayed a toast with the kicked message
            toast(`Kicked player "${player.name}"`)
        }
        if (DEBUG) console.debug('Kicked player ' + id) // Print debug kicked message
        delete this.players[id] // Remove the player for the map
        this.send(packets.kick(id)) // Send a kick player packet
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
    if (!socket) socket = new SocketApi(HOST)
    return socket
}

/**
 * A "Composable" function to ensure that the current game state is a
 * valid game. Will redirect to the home screen if the game state is
 * unset or non-existent. If the game state is stopped the Game Over
 * screen will be redirected to instead
 *
 * @param socket The socket connection
 */
export function useRequireGame(socket: SocketApi) {
    const router = useRouter()
    const {gameState, gameData} = socket
    // Watch for changes in the current game state
    watch(gameState, (value: GameState) => {
        if (gameData.value === null
            || value === GameState.UNSET
            || value === GameState.DOES_NOT_EXIST) { // If we are no longer in a game
            router.push({name: 'Home'}).then() // Return to the home screen
        } else if (value === GameState.STOPPED) { // If the game has ended
            router.push({name: 'GameOver'}).then() // Send to the game over screen
        }
    }, {immediate: true})
}

/**
 * A "Composable" function for adding a listener to a specific game state.
 * Will run the provided handle function when the game state is the same
 * as the provided state
 *
 * @param socket The socket instance to listen on
 * @param state The desired game state
 * @param handle The listener function
 */
export function useGameState(socket: SocketApi, state: GameState, handle: Function) {
    const {gameState} = socket
    // Watch for changes in the current game state
    watch(gameState, (value: GameState) => {
        if (value === state) {
            handle()
        }
    }, {immediate: true})
}

/**
 * "Composable" function for adding a new packet listening handler to listen
 * for packets and invoked the provided handler function
 *
 * @param socket The socket instance to listen on
 * @param id The id of the packets to listen for
 * @param handler The listener packet handling function
 */
export function usePacketHandler<D>(socket: SocketApi, id: SPID, handler: (data: D) => any) {
    // Set the packet handler to the provided handler
    socket.handlers[id] = handler
    // Reset the handler on unmount
    onUnmounted(() => {
        const current = socket.handlers[id];
        if (current === handler) {
            socket.handlers[id] = EMPTY_HANDLER
        }
    })
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
        update()
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
            // Request the next animation frame
            requestAnimationFrame(update)
        }
    }

    // Listen for time sync packets with onTimeSync
    usePacketHandler(socket, SPID.TIME_SYNC, onTimeSync)
    return value
}