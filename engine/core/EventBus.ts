import { EngineEventMap } from './Types';

type EventCallback<T> = (data: T) => void;

export class EventBus {
    private subscribers: { [K in keyof EngineEventMap]?: EventCallback<EngineEventMap[K]>[] } = {};

    public on<K extends keyof EngineEventMap>(event: K, callback: EventCallback<EngineEventMap[K]>): () => void {
        if (!this.subscribers[event]) {
            this.subscribers[event] = [];
        }
        (this.subscribers[event] as EventCallback<EngineEventMap[K]>[]).push(callback);

        // Return unbind function
        return () => {
            const list = this.subscribers[event] as EventCallback<EngineEventMap[K]>[] | undefined;
            if (list) {
                this.subscribers[event] = list.filter((cb) => cb !== callback) as any;
            }
        };
    }

    public emit<K extends keyof EngineEventMap>(event: K, data: EngineEventMap[K]): void {
        const list = this.subscribers[event];
        if (list) {
            for (let i = 0; i < list.length; i++) {
                list[i](data);
            }
        }
    }

    public clear(): void {
        this.subscribers = {};
    }
}