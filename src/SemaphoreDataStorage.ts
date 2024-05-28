export class SemaphoreDataStorage {
  private limits: Record<string, number> = {};
  private readonly limitDefault: number;
  private storageIdentifier: null | string = null;

  constructor(defaultLimit: number) {
    this.limitDefault = defaultLimit;
  }

  public getLimit(identifier: string) {
    return this.limits[identifier] ?? this.limitDefault;
  }

  public setLimit(identifier: string, limit: number) {
    this.limits[identifier] = Math.max(Math.min(limit, this.limitDefault), 0);
    this.save();
  }

  public enableSyncing(storageKey: string): (() => void) | null {
    if (this.storageIdentifier !== null) {
      console.warn("semaphore syncing is already enabled. ignore new request");
      return null;
    }
    this.storageIdentifier = storageKey + this.limitDefault;
    this.sync();

    const listener = (event: StorageEvent) => {
      if (
        event.storageArea !== window.sessionStorage ||
        event.key !== this.storageIdentifier
      )
        return;
      this.sync();
    };

    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("storage", listener);
    };
  }

  private sync() {
    if (this.storageIdentifier === null) return;
    const dict: Record<string, unknown> = JSON.parse(
      window.sessionStorage.getItem(this.storageIdentifier) ?? "{}",
    );
    this.limits =
      dict.limits !== undefined
        ? (dict.limits as Record<string, number>)
        : this.limits;
  }

  private save() {
    if (this.storageIdentifier === null) return;
    const dict: Record<string, unknown> = JSON.parse(
      window.sessionStorage.getItem(this.storageIdentifier) ?? "{}",
    );
    dict.limit = this.limits;
    window.sessionStorage.setItem(this.storageIdentifier, JSON.stringify(dict));
  }
}
