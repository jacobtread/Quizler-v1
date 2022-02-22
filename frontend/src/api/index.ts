import packets, {
    DisconnectData,
    ErrorData,
    GameStateData,
    JoinGameData,
    NameTakenResultData,
    Packet,
    PlayerData,
    PlayerDataP,
    QuestionData
} from "./packets";
import mitt from "mitt";
import { onMounted, onUnmounted, reactive, ref, Ref, UnwrapNestedRefs } from "vue";
import { useGameStore } from "@store/game";

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

type Events = {
    state: string;
    game: JoinGameData | null;
    players: PlayerMap;
    disconnect: string;
    gameState: GameState;
    nameTaken: boolean;
    reset: void;
}

export enum GameState {
    WAITING,
    STARTED,
    STOPPED,
    DOES_NOT_EXIST
}

interface PlayerMap {
    [name: string]: PlayerData
}

enum Direction {
    IN,
    OUT
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

    private gameCode: string | null = null
    players: PlayerMap = {}

    // The interval timer handle used to cancel the update interval
    private updateInterval: any = undefined

    // The last time a server keep alive response was received
    private lastServerKeepAlive: number = -1
    // The last time that this client sent a keep alive at
    private lastSendKeepAlive: number = -1

    state: GameState = GameState.DOES_NOT_EXIST

    events = mitt<Events>()

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
        this.events.emit('state', 'open')
    }

    /**
     * Called when the web socket connection is closed
     */
    onClose() {
        this.isOpen = false
        this.events.emit('state', 'closed')
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
        this.events.emit('reset')
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
        api.events.emit('players', api.players)
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
        api.events.emit('gameState', state)
    }

    /**
     * Packet handler for NameTakenResult packet (0x11) handles the result
     * of the name taken check
     *
     * @param api The current connection instance
     * @param data Contains whether the name is token
     */
    onNameTakenResult(api: SocketApi, data: NameTakenResultData) {
        api.events.emit('nameTaken', data.result)
    }

    private static getGameState(id: number): GameState {
        if (id == 0) {
            return GameState.WAITING
        } else if (id == 1) {
            return GameState.STARTED
        } else if (id == 2) {
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
        api.events.emit('reset')
        api.setGameCode(null)
        api.events.emit('disconnect', data.reason)
    }

    /**
     * Packet handler for the KeepAlive packet (0x01) handles updating the
     * lastServerKeepAlive time ensuring that the server is still alive
     *
     * @param api The current connection instance
     */
    onKeepAlive(api: SocketApi) {
        api.lastServerKeepAlive = performance.now()
        if (api.isDebug) console.debug('Server is alive')
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
    }

    /**
     * Packet handler for the Join Game packet (0x06) handles the player
     * joining the game. Sets the game code and emits relevent events
     *
     * @param api The current connection instance
     * @param data The data for the game contains the id and title
     */
    onJoinGame(api: SocketApi, data: JoinGameData) {
        if (api.isDebug) console.debug(`Joined game with id ${data}`)
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
            let name = packets.names[dir][id] // Retrieve debug friendly packet name
            if (!name) name = 'Unknown Name'
            let dirName = dir == 0 ? '<-' : '->'

            if (packet.data !== undefined) {
                const dataString = JSON.stringify(packet.data)
                console.debug(`[${dirName}] ${name} (${toHex(id, 2)}) {${dataString}}`)
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


    requestGameState(id: string) {
        this.send(packets.requestGameState(id))
    }

    /**
     * Tells the websocket server to create a new game instance
     * with the provided tile and questions
     *
     * The server will respond with a 0x06 Game Join packet which
     * contains the id and title of the created game server
     *
     * @param title The title for the game
     * @param questions The questions for the game
     */
    createGame(title: string, questions: QuestionData[]) {
        if (this.isDebug) console.debug(`Creating game ${title}`)
        this.send(packets.createGame(title, questions))
    }

    /**
     * Requests to join the provided game code
     *
     * @param id The id/code of the game room
     * @param name The name to join using
     */
    requestJoin(id: string, name: string) {
        this.send(packets.requestJoin(id, name))
    }

    setGameCode(data: JoinGameData | null) {
        this.gameCode = data ? data.id : null
        this.events.emit('game', data)
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
        console.log('Kicked player ' + id)
        delete this.players[id]
        this.send(packets.kick(id))
        this.events.emit('players', this.players)
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
    players: UnwrapNestedRefs<PlayerMap>;
}

/**
 * "Composable" function to use the SocketApi within vue js
 * through the composition API this will create a socket
 * instance if it doesn't already exist and will bind the
 * open state event to an open ref
 */
export function useApi(): UseApi {
    let open = ref(false)
    if (!socket) socket = new SocketApi()
    let players = reactive<PlayerMap>({})

    function updatePlayers(data: PlayerMap) {
        for (let dataKey in data) {
            players[dataKey] = data[dataKey]
        }
    }

    function updateState(state: string) {
        open.value = state === 'open';
    }

    const gameState = useGameStore()

    function handleReset() {
        gameState.$reset()
    }

    onMounted(() => {
        socket.events.on('state', updateState)
        socket.events.on('players', updatePlayers)
        socket.events.on('reset', handleReset)
        updatePlayers(socket.players)
    })

    onUnmounted(() => {
        socket.events.off('state', updateState)
        socket.events.off('players', updatePlayers)
        socket.events.off('reset', handleReset)
    })

    return {socket, players, open}
}