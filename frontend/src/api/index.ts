import packets, { ErrorData, Packet } from "./packets";

export const APP_HOST: string = import.meta.env.VITE_HOST

const IGNORE = () => {
}

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

export class SocketApi {

    private ws: WebSocket = this.connect()

    private isOpen: boolean = false
    private isRunning: boolean = true
    private isDebug: boolean = true

    // The interval timer handle used to cancel the update interval
    private updateInterval: any = undefined

    // The last time a server keep alive response was received
    private lastServerKeepAlive: number = -1
    // The last time that this client sent a keep alive at
    private lastSendKeepAlive: number = -1


    private handlers: PacketHandlers = {
        0x00: IGNORE,
        0x01: this.onKeepAlive,
        0x03: this.onError
    }

    connect(): WebSocket {
        const ws = new WebSocket(APP_HOST)
        ws.onopen = () => this.onOpened()
        ws.onmessage = (e) => this.onMessage(e)
        ws.onclose = () => this.onClose()
        ws.onerror = (e: Event) => {
            this.disconnect()
            console.error(e)
        }
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
        }
        this.updateInterval = setInterval(() => this.update())
        return ws
    }

    onOpened() {
        console.log('Connected')
        if (this.ws.readyState != WebSocket.OPEN) return
        this.isOpen = true
    }

    onMessage(event: MessageEvent) {
        try {
            const packet = JSON.parse(event.data) as Packet<any>
            const id: number = packet.id
            if (id in packets.names) {
                const name: string = packets.names[id]
                const data: any = packet.data

                if (this.isDebug) {
                    if (data !== undefined) {
                        console.debug(`[IN] ${name} (${toHex(id, 2)}) {${data}}`)
                    } else {
                        console.debug(`[IN] ${name} (${toHex(id, 2)})`)
                    }
                }

                if (id in this.handlers) {
                    const handler = this.handlers[id]
                    handler(this, data)
                } else {
                    console.warn(`Don't know how to handle packet with id (${id.toString(16)})`)
                }
            } else {
                console.warn(`Don't know how to handle packet with id (${id.toString(16)})`)
            }
        } catch (e) {
            console.error(e)
        }
    }


    onClose() {
        console.info('Disconnected')
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

    send(packet: Packet<any>) {
        if (this.isDebug) {
            const name = packets.names[packet.id]
            if (packet.data !== undefined) {
                console.debug(`[IN] ${name} (${toHex(packet.id, 2)}) {${packet.data}}`)
            } else {
                console.debug(`[OUT] ${name} (${toHex(packet.id, 2)})`)
            }
        }
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