type Handler<T = any, R = any> = (data?: T) => R

class Observable {
  static instance?: Observable
  handlers: { [key: string]: Handler } = {}

  constructor() {
    if (Observable.instance instanceof Observable) {
      return Observable.instance
    }
    Observable.instance = Object.freeze(this)
  }

  subscribe<T extends string>(fnName: T, callback: Handler) {
    this.handlers[fnName] = callback
  }

  unsubscribe(fnName: string) {
    delete this.handlers[fnName]
  }

  fire<T extends string, K>(fnName: T, data?: K) {
    const handler = this.handlers[fnName] as Handler<K, unknown> | undefined
    return handler?.(data)
  }

  isExit(handlerKey: string) {
    return !!this.handlers[handlerKey]
  }
}

export const observer = new Observable()
