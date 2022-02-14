import packets, { ErrorData, Packet } from "./packets";

export const APP_HOST: string = import.meta.env.VITE_HOST

const IGNORE = () => {
}

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

/**
 * Stores all logic for communicating between the client and server over the
 * websocket connection.
 */
export class SocketApi {

    // The websocket connection instance
    private ws: WebSocket = this.connect()

    // Whether the web socket connection is open
    private isOpen: boolean = false
    // Whether the main update loop is running
    private isRunning: boolean = true
    // Whether debug logging should be enabled
    private isDebug: boolean = true

    // The interval timer handle used to cancel the update interval
    private updateInterval: any = undefined

    // The last time a server keep alive response was received
    private lastServerKeepAlive: number = -1
    // The last time that this client sent a keep alive at
    private lastSendKeepAlive: number = -1

    /**
     * A mapping to convert the packet ids into handler functions so that
     * they can be handled separately instead of a large switch statement
     */
    private handlers: PacketHandlers = {
        0x00: IGNORE,
        0x01: this.onKeepAlive,
        0x03: this.onError
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
            this.disconnect()
            console.error(e)
        }
        if (this.updateInterval) clearInterval(this.updateInterval)
        this.updateInterval = setInterval(() => this.update(), 0)
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
        this.isOpen = true
    }

    /**
     * Called when the web socket connection is closed
     */
    onClose() {
        console.info('Disconnected')
        this.isOpen = false
        this.disconnect()
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
                this.debugPacket('IN', packet)
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
     * Packet handler for the KeepAlive packet (0x01) handles updating the
     * lastServerKeepAlive time ensuring that the server is still alive
     *
     * @param api The current connection instance
     */
    onKeepAlive(api: SocketApi) {
        api.lastServerKeepAlive = performance.now()
        console.debug('Server is alive')
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
     * Debug logs information about the provided packet
     *
     * @param dir The direction the packet is going IN for inbound OUT for outbound
     * @param packet The packet to print debug info about
     */
    debugPacket(dir: string, packet: Packet<any>) {
        if (this.isDebug) { // Ensure that this only happens in debug mode
            const id = packet.id
            let name = packets.names[id] // Retrieve debug friendly packet name
            if (!name) name = 'Unknown Name'
            if (packet.data !== undefined) {
                console.debug(`[${dir}] ${name} (${toHex(id, 2)}) {${packet.data}}`)
            } else {
                console.debug(`[${dir}] ${name} (${toHex(id, 2)})`)
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
        this.debugPacket('OUT', packet)
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
     * Called when the client should disconnect from the server. Clears the
     * update interval along with stopping the running loop and if the ws
     * connection is open according to isOpen then it will be closed as well
     */
    disconnect() {
        console.log('Client Disconnect')
        this.isRunning = false
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
        }
        if (this.isOpen) {
            this.isOpen = false
            try {
                this.ws.close()
            } catch (e) {
            }
        }
    }

    /**
     * An update loop. This runs constantly as long as disconnect is not
     * called. Currently, this just handles keeping the connection alive
     * and checking if the connection has timed out
     */
    update() {
        if (this.isRunning && this.isOpen) {
            const time = performance.now()
            if (time - this.lastServerKeepAlive > 5000) {
                this.disconnect()
                return
            }

            if (time - this.lastSendKeepAlive > 1000) {
                this.keepAlive()
            }
        }

    }

}