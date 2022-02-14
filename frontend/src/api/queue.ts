export type Callback = (value: CommandData) => void
export type QueueCallback = (id: number) => Callback

interface CallbackById {
    [id: number]: Callback
}

export class OutboundQueue {

    private queue: QueueCallback[] = []
    private mapping: CallbackById = {}
    private availableIds: number[] = []

    constructor() {
        this.setAllAvailable()
    }

    private setAllAvailable() {
        this.availableIds = [0, 1, 2, 3, 4, 5]
    }

    reset() {
        this.setAllAvailable()
        this.mapping = {}
    }

    add(callback: QueueCallback) {
        if (this.availableIds.length > 0) {
            const id = this.availableIds[0]
            this.mapping[id] = callback(id)
        } else {
            this.queue.push(callback)
        }
    }

    update() {
        if (this.availableIds.length > 0 && this.queue.length > 0) {
            this.add(this.queue[0])
        }
    }

    resolve(id: number, data: any) {
        const callback = this.mapping[id]
        delete this.mapping[id]
        callback(data)
    }

}