import {
    AnswerResultPacket,
    DisconnectPacket,
    ErrorPacket,
    GameStatePacket,
    JoinGamePacket,
    KickPacket,
    NameTakenResultPacket,
    PlayerDataMode,
    PlayerDataPacket,
    QuestionPacket,
    ScoresPacket,
    StateChangePacket,
    States,
    TimeSyncPacket
} from "./packets";
import { onUnmounted, reactive, ref, Ref, watch } from "vue";
import { dialog, toast } from "@/tools/ui";
import { DEBUG, HOST } from "@/constants";
import { router } from "@/router";
import { useRouter } from "vue-router";
import { BinarySocket, PacketDefinition } from "gowsps-js";
import { StructLayout, StructTyped } from "gowsps-js/dist/data";

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

export interface PlayerData {
    id: string;
    name: string;
    score: number;
}

export interface GameData {
    owner: boolean;
    id: string;
    title: string;
}

export interface QuestionData {
    imageBase64?: string;
    imageType: string;
    image: Uint8Array;
    question: string;
    answers: string[];
}

export type QuestionDataWithValues = {
    values: number[]
} & QuestionData

/**
 * Stores all logic for communicating between the client and server over the
 * websocket connection.
 */
export class Client {

    // The websocket connection instance
    socket: BinarySocket

    open = ref(false) // The open state of the web socket connection
    gameData = ref<GameData | null>(null) // The current game data
    players = reactive<PlayerMap>({}) // The map of players to their names
    question = ref<QuestionData | null>(null) // The active question in the game (store here to persist)
    gameState = ref<GameState>(GameState.UNSET) // The current game state
    self = ref<PlayerData | null>(null) // The player we are playing as

    /**
     * Creates a new socket instance
     *
     * @param host The websocket server host address
     */
    constructor(host: string) {
        const socket = new BinarySocket(host, {reconnectTimeout: 2000})
        socket.setInterceptor((id,data) => {
            console.table({id, data})
        })
        socket.addEventListener('open', () => {
            if (DEBUG) console.debug('Connected to socket server') // Debug logging
            this.open.value = true // Update the open state
        })
        socket.addEventListener('close', () => {
            this.open.value = false
        })
        socket.definePackets(
            DisconnectPacket,
            ErrorPacket,
            JoinGamePacket,
            NameTakenResultPacket,
            GameStatePacket,
            PlayerDataPacket,
            TimeSyncPacket,
            QuestionPacket,
            AnswerResultPacket,
            ScoresPacket,
        )
        socket.addListener(DisconnectPacket, async ({reason}) => {
            if (this.gameState.value !== GameState.STOPPED) {
                dialog('Disconnected', reason) // Display a disconnected dialog with the reason
            }
            this.resetState()
            await router.push({name: 'Home'})
        })
        socket.addListener(ErrorPacket, ({cause}) => {
            console.error(`An error occurred ${cause}`) // Print the error to the console
            dialog('Error occurred', cause) // Display an error dialog
        })
        socket.addListener(JoinGamePacket, (data: GameData) => {
            this.gameData.value = data
            this.gameState.value = GameState.WAITING
        })
        socket.addListener(GameStatePacket, ({state}) => {
            this.gameState.value = state
        })
        socket.addListener(PlayerDataPacket, ({name, id, mode}) => {
            const elm: PlayerData = {id, name, score: 0}
            if (mode === PlayerDataMode.ADD || mode === PlayerDataMode.SELF) { // If the mode is ADD or SELF
                this.players[id] = elm // Assign the ID in the player map
                if (mode === PlayerDataMode.SELF) { // If the mode is SELF
                    this.self.value = elm // Set the self player to the player data
                }
            } else if (mode === PlayerDataMode.REMOVE) { // if the mode is REMOVE
                delete this.players[id] // Remove the ID from the player map
            }
        })
        socket.addListener(QuestionPacket, (data: QuestionData) => {
            this.question.value = data
        })
        socket.addListener(ScoresPacket, ({scores}) => {
            for (let dataKey in scores) {
                const player = this.players[dataKey]
                if (player) {
                    player.score = scores[dataKey]
                }
            }
        })
        this.socket = socket
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
     * Called when the client should disconnect from the server. Clears the
     * update interval along with stopping the running loop and if the ws
     * connection is open according to isOpen then it will be closed as well
     */
    disconnect() {
        if (DEBUG) console.debug('Disconnected from game') // Print debug disconnected message
        this.socket.send(StateChangePacket, {state: States.DISCONNECT})
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
        this.socket.send(KickPacket, {id}) // Send a kick player packet
    }
}

// The socket instance
let client: Client

/**
 * A function for using the socket connection. Will create a new
 * socket connection if there isn't already one
 */
export function useClient(): Client {
    // If we don't have a socket instance create a new one
    if (!client) client = new Client(HOST)
    return client
}

/**
 * A "Composable" function to ensure that the current game state is a
 * valid game. Will redirect to the home screen if the game state is
 * unset or non-existent. If the game state is stopped the Game Over
 * screen will be redirected to instead
 *
 * @param socket The socket connection
 */
export function useRequireGame(socket: Client) {
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
export function useGameState(socket: Client, state: GameState, handle: Function) {
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
 * @param client The client instance to listen on
 * @param definition The packet definition to listen for
 * @param handler The listener packet handling function
 */
export function usePacketHandler<D extends StructLayout>(client: Client, definition: PacketDefinition<D>, handler: (data: StructTyped<D>) => any) {
    // Set the packet handler to the provided handler
    client.socket.addListener(definition, handler)
    // Reset the handler on unmount
    onUnmounted(() => {
        client.socket.removeListener(definition, handler)
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
export function useSyncedTimer(socket: Client, initialValue: number): Ref<number> {
    // The actual value itself that should be displayed
    const value = ref<number>(initialValue)

    // Stores the last time in milliseconds that the counter ran a countdown animation
    let lastUpdateTime: number = -1

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
    usePacketHandler(socket, TimeSyncPacket, ({remaining, total}) => {
        console.log(remaining, total)
        // Convert the remaining time to seconds and ceil it
        value.value = Math.ceil(remaining / 1000)
        // Set the last update time = now to prevent it updating again
        // and causing an accidental out of sync
        lastUpdateTime = performance.now()
        update()
    })
    return value
}