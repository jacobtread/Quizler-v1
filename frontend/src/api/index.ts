import { Callback, OutboundQueue } from "./queue";

const APP_HOST = import.meta.env.VITE_HOST as string

export class SocketApi {

    private ws: WebSocket = this.connect();
    private isOpen: boolean = false;
    private queue: OutboundQueue = new OutboundQueue()

    connect() {
        const ws = new WebSocket(APP_HOST)
        ws.onopen = () => {
            console.debug('Connected')
            if (ws.readyState != WebSocket.OPEN) return
            this.isOpen = true
        this.command('Test', {}).then()
        }
        ws.onmessage = (event: MessageEvent) => {
            const data = event.data
            const id = parseInt(data.id)
            this.queue.resolve(id, data.data)
        }
        ws.onclose = () => {
            console.debug('Disconnected')
            this.isOpen = false
        }
        ws.onerror = (event: Event) => {
            console.error(`Error occurred: ${event}`)
        }
        return ws
    }

    async command<V>(name: string, data: CommandData): Promise<V> {
        return new Promise((resolve, reject) => {
            this.queue.add((id: number): Callback => {
                this.ws.send(JSON.stringify({id, name, data}))
                return resolve
            })
        })
    }
}