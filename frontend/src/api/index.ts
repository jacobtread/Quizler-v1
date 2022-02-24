import packets, {
    DisconnectData,
    ErrorData,
    GameStateData,
    JoinGameData,
    NameTakenResultData,
    Packet,
    PlayerData,
    PlayerDataP
} from "./packets";
import { onMounted, onUnmounted, reactive, ref, Ref, UnwrapNestedRefs } from "vue";
import { useGameStore } from "@store/game";
import { dialog, events, toast } from "@/events";

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
    WAITING,
    STARTING,
    STARTED,
    STOPPED,
    DOES_NOT_EXIST
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

    // Whether the web socket connection is open
    private isOpen: boolean = false
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

    gameCode: string | null = null // The current game code or null
    players: PlayerMap = {} // The map of players to their names
    state: GameState = GameState.DOES_NOT_EXIST // The current game state

    /**
     * A mapping to convert the packet ids into handler functions so that
     * they can be handled separately instead of a large switch statement
     */
    private handlers: PacketHandlers = {
        0x00: this.onKeepAlive,
        0x01: this.onDisconnect,
        0x02: this.onError,
        0x03: this.onJoinGame,
        0x04: this.onNameTakenResult,
        0x05: this.onGameState,
        0x06: this.onPlayerData,
        0x07: EMPTY_HANDLER, // onTimeSyc
        0x08: EMPTY_HANDLER, // onQuestion
        0x09: EMPTY_HANDLER, // onAnswerResult
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
        this.isOpen = true
        events.emit('open', true)
    }

    /**
     * Called when the web socket connection is closed
     */
    onClose() {
        this.isOpen = false
        events.emit('open', false)
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
        this.isOpen = false
        events.emit('reset')
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
        events.emit('players', api.players)
    }

    /**
     * Packet handler for GameState packet (0x08) handles keeping track
     * of the games state
     *
     * @param api The current connection instance
     * @param data The current game state
     */
    onGameState(api: SocketApi, data: GameStateData) {
        const state = SocketApi.getGameState(data.state)
        api.state = state
        events.emit('gameState', state)
    }

    /**
     * Packet handler for NameTakenResult packet (0x11) handles the result
     * of the name taken check
     *
     * @param api The current connection instance
     * @param data Contains whether the name is token
     */
    onNameTakenResult(api: SocketApi, data: NameTakenResultData) {
        events.emit('nameTaken', data.result)
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
        events.emit('reset')
        api.setGameCode(null)
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
    onJoinGame(api: SocketApi, data: JoinGameData) {
        api.setGameCode(data)
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
     * Set's the current game code and emit the game
     * event
     *
     * @param data The data or null to clear the game code .
     */
    setGameCode(data: JoinGameData | null) {
        this.gameCode = data ? data.id : null
        events.emit('game', data)
    }

    /**
     * Called when the client should disconnect from the server. Clears the
     * update interval along with stopping the running loop and if the ws
     * connection is open according to isOpen then it will be closed as well
     */
    disconnect() {
        console.log('Disconnected from game')
        this.setGameCode(null)
        this.send(packets.disconnect())
        if (this.isRunning) {

        }
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
        events.emit('players', this.players)
    }

    /**
     * An update loop. This runs constantly as long as disconnect is not
     * called. Currently, this just handles keeping the connection alive
     * and checking if the connection has timed out
     */
    update() {
        if (this.isRunning && this.isOpen) {
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

interface UseApi {
    socket: SocketApi;
    open: Ref<boolean>;
    state: Ref<GameState>;
    players: UnwrapNestedRefs<PlayerMap>;
}

/**
 * "Composable" function to use the SocketApi within vue js
 * through the composition API this will create a socket
 * instance if it doesn't already exist and will bind the
 * open state event to an open ref
 */
export function useApi(): UseApi {
    const open = ref(false)
    const state = ref<GameState>(GameState.DOES_NOT_EXIST)
    if (!socket) socket = new SocketApi()
    const players = reactive<PlayerMap>({})

    function clearPlayers() {
        for (let key of Object.keys(players)) {
            delete players[key]
        }
    }

    function updatePlayers(data: PlayerMap) {
        for (let key of Object.keys(players)) {
            if (!data[key]) delete players[key]
        }
        for (let dataKey in data) {
            players[dataKey] = data[dataKey]
        }
    }

    function updateState(state: boolean) {
        open.value = state;
    }

    function updateGameState(data: GameState) {
        state.value = data
    }

    const gameState = useGameStore()

    function handleReset() {
        gameState.$reset()
        clearPlayers()
    }

    onMounted(() => {
        events.on('gameState', updateGameState)
        events.on('open', updateState)
        events.on('players', updatePlayers)
        events.on('reset', handleReset)
        updatePlayers(socket.players)
        state.value = socket.state
    })

    onUnmounted(() => {
        events.off('gameState', updateGameState)
        events.off('open', updateState)
        events.off('players', updatePlayers)
        events.off('reset', handleReset)
    })

    return {socket, players, open, state}
}