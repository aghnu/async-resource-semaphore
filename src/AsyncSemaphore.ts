import {
  SemaphoreDataMemeoryStorage,
  type SemaphoreDataStorage,
} from "./SemaphoreDataStorage.ts";

export const DEFAULT_IDENTIFIER: string = "semaphore-default" as const;

export class AsyncSemaphore {
  private readonly semaphoreDataStorage: SemaphoreDataStorage;

  constructor(
    storageOption: SemaphoreDataStorage = new SemaphoreDataMemeoryStorage(),
  ) {
    this.semaphoreDataStorage = storageOption;
  }

  private decreaseLimit(identifier: string): void {
    this.semaphoreDataStorage.setLimit(
      identifier,
      this.semaphoreDataStorage.getLimit(identifier) - 1,
    );
  }

  private increaseLimit(identifier: string): void {
    this.semaphoreDataStorage.setLimit(
      identifier,
      this.semaphoreDataStorage.getLimit(identifier) + 1,
    );
  }

  public async take(identifier = DEFAULT_IDENTIFIER): Promise<void> {
    await new Promise<void>((resolve) => {
      const checking = (): void => {
        if (this.semaphoreDataStorage.getLimit(identifier) > 0) {
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
