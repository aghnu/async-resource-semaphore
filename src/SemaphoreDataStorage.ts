export interface SemaphoreDataStorage {
  getLimit: (identifier: string) => number;
  setLimit: (identifier: string, limit: number) => void;
}

export class SemaphoreDataMemeoryStorage implements SemaphoreDataStorage {
  private readonly limitDefault: number;
  private readonly limits: Map<string, number>;

  constructor(defaultLimit = 1) {
    this.limitDefault = defaultLimit;
    this.limits = new Map();
  }

  public getLimit(identifier: string): number {
    return this.limits.get(identifier) ?? this.limitDefault;
  }

  public setLimit(identifier: string, limit: number) {
    return this.limits.set(identifier, limit);
  }
}

export class SemaphoreDataSessionStorage implements SemaphoreDataStorage {
  private readonly storageIdentifier: string;

  constructor(storageKey: string) {
    this.storageIdentifier = `semaphore-lock__${storageKey}`;
  }

  public getLimit(identifier: string): number {
    return window.sessionStorage.getItem(
      `${this.storageIdentifier}__${identifier}`,
    ) === undefined
      ? 1
      : 0;
  }

  public setLimit(identifier: string, limit: number) {
    limit <= 0
      ? window.sessionStorage.setItem(
          `${this.storageIdentifier}__${identifier}`,
          "",
        )
      : window.sessionStorage.removeItem(
          `${this.storageIdentifier}__${identifier}`,
        );
  }
}
