/**
 * Simple Event Emitter implementation
 */
class EventEmitter {
    constructor() {
        this._events = {};
    }

    on(event, listener) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(listener);
        return this;
    }

    off(event, listener) {
        if (!this._events[event]) return this;

        const index = this._events[event].indexOf(listener);
        if (index !== -1) {
            this._events[event].splice(index, 1);
        }
        return this;
    }

    emit(event, ...args) {
        if (!this._events[event]) return false;

        const listeners = this._events[event].slice();
        for (let i = 0; i < listeners.length; i++) {
            listeners[i].apply(this, args);
        }
        return true;
    }

    once(event, listener) {
        const self = this;
        function fn(...args) {
            self.off(event, fn);
            listener.apply(self, args);
        }
        this.on(event, fn);
        return this;
    }
}
