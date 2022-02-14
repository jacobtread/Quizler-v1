type Callback = (value: any) => void

interface CallbackById {
    [id: number]: Callback
}

export const APP_HOST = import.meta.env.VITE_HOST as string

export class SocketApi {

    private ws: WebSocket = this.connect()
    private isOpen: boolean = false

    private queue: Callback[] = []
    private ids: number[] = []

    private mapping: CallbackById = {}

    private updateInterval: any = undefined

    connect(): WebSocket {
        const ws = new WebSocket(APP_HOST)
        ws.onopen = () => this.onOpened()
        ws.onmessage = (e) => this.onMessage(e)
        ws.onclose = () => this.onClose()
        ws.onerror = (e) => this.onError(e)
        this.clearIds()
        if (this.updateInterval) {
            clearInterval(this.updateInterval)
        }
        this.updateInterval = setInterval(() => this.update())
        return ws
    }

    clearIds() {
        this.ids = [0, 1, 2, 3, 4, 5]
    }

    onOpened() {
        console.log(this)
    }

    onMessage(event: MessageEvent) {
        console.log(event)
    }

    onClose() {
        console.info('Disconnected')
    }

    onError(event: Event) {
        console.error(`An error occurred ${event}`)
    }

    update() {

    }

    async send<V>(name: string, data: any): Promise<V> {
        return new Promise((resolve, reject) => {
            if (this.ids.length > 0) {
                const id = this.ids.shift()
                const message = {id, name, data}

            }
        })
    }

}