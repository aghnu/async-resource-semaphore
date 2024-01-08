export const DEFAULT_IDENTIFIER: string = "semaphore-default" as const;

export class AsyncSemaphore {
  private readonly limits = new Map<string, number>();
  private readonly limitDefault: number;

  constructor(maxResourceLimit = 1) {
    this.limitDefault = maxResourceLimit;
  }

  private getLimit(identifier: string): number {
    const limit = this.limits.get(identifier);
    if (limit === undefined) {
      this.limits.set(identifier, this.limitDefault);
      return this.limitDefault;
    }

    return limit;
  }

  private decreaseLimit(identifier: string): void {
    const limit = this.limits.get(identifier);
    if (limit === undefined) {
      this.limits.set(identifier, this.limitDefault - 1);
      return;
    }
    this.limits.set(identifier, limit - 1);
  }

  private increaseLimit(identifier: string): void {
    const limit = this.limits.get(identifier);
    if (limit === undefined) {
      this.limits.set(identifier, this.limitDefault);
      return;
    }
    this.limits.set(identifier, Math.min(limit + 1, this.limitDefault));
  }

  public async take(identifier = DEFAULT_IDENTIFIER): Promise<void> {
    await new Promise<void>((resolve) => {
      const checking = (): void => {
        if (this.getLimit(identifier) > 0) {
          this.decreaseLimit(identifier);
          resolve();
          return;
        }
        setTimeout(checking);
      };
      checking();
    });
  }

  public give(identifier = DEFAULT_IDENTIFIER): void {
    this.increaseLimit(identifier);
  }

  public async run<R>(
    criticalSection: () => Promise<R>,
    identifier = DEFAULT_IDENTIFIER,
  ): Promise<R> {
    await this.take(identifier);
    try {
      const result = await criticalSection();
      return result;
    } finally {
      this.give(identifier);
    }
  }
}
