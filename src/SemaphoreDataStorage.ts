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
    return this.limits.set(
      identifier,
      Math.min(Math.max(limit, 0), this.limitDefault),
    );
  }
}
