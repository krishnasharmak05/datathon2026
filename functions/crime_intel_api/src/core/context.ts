import { AsyncLocalStorage } from 'async_hooks';

export class CatalystContext {
  private static storage = new AsyncLocalStorage<any>();

  static run(app: any, callback: () => void) {
    this.storage.run(app, callback);
  }

  static current(): any {
    const app = this.storage.getStore();
    if (!app) {
      throw new Error('CatalystContext is not initialized for the current request.');
    }
    return app;
  }
}
