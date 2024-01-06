export class AsyncSemaphore {
  private readonly limits = new Map<string, number>();
  private readonly limitDefault: number;

  constructor(limit = 1) {
    this.limitDefault = limit;
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

  private async takeResource(identifier: string): Promise<void> {
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

  private returnResource(identifier: string): void {
    this.increaseLimit(identifier);
  }

  public async run<R>(
    asyncFunc: () => Promise<R>,
    identifier = "default",
  ): Promise<R> {
    await this.takeResource(identifier);
    try {
      const result = await asyncFunc();
      return result;
    } finally {
      this.returnResource(identifier);
    }
  }
}
