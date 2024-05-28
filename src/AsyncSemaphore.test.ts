import { AsyncSemaphore, DEFAULT_IDENTIFIER } from "./AsyncSemaphore.ts";
import {
  SemaphoreDataMemeoryStorage,
  type SemaphoreDataStorage,
} from "./SemaphoreDataStorage.ts";

interface AsyncSemaphoreProperties {
  semaphoreDataStorage: SemaphoreDataStorage;
  run: AsyncSemaphore["run"];
}

const createNewAsyncSemaphore = (resourceLimit: number) => {
  return new AsyncSemaphore(
    new SemaphoreDataMemeoryStorage(resourceLimit),
  ) as unknown as AsyncSemaphoreProperties;
};

const sleep = async (time: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
};

describe("The semaphore instance is created with resource limit is set to 1", () => {
  const resourceLimit = 1;
  let semaphore = createNewAsyncSemaphore(resourceLimit);

  afterEach(() => {
    semaphore = createNewAsyncSemaphore(resourceLimit);
  });

  test("The default limit is set to 1 when init", async () => {
    // default limit is used when create new item inside limits map
    await semaphore.run(async () => {});
    expect(semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER)).toBe(
      resourceLimit,
    );
  });

  test("The custom identifier is correctly set when custom identifier is given", async () => {
    // limits map should have default
    await semaphore.run(async () => {});
    expect(
      semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER) !== undefined,
    ).toBe(true);

    // limits map should have the custom identifier
    await semaphore.run(async () => {}, "custom-identifier");
    expect(
      semaphore.semaphoreDataStorage.getLimit("custom-identifier") !==
        undefined,
    ).toBe(true);
  });
});

describe("The semaphore instance should limit access to critical section", () => {
  let semaphore = createNewAsyncSemaphore(1);

  afterEach(() => {
    semaphore = createNewAsyncSemaphore(1);
  });

  test("The resource limit decrease during the run of passed in async func", async () => {
    // resource limit is set to correct resource limit
    await semaphore.run(async () => {});
    expect(semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER)).toBe(1);

    // default limit is used when create new item inside limits map
    await semaphore.run(async () => {
      expect(semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER)).toBe(
        0,
      );
    });

    // default limit is increased to default when finish excuting the async func
    expect(semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER)).toBe(1);
  });

  test("The resource should be returned when async function throw error during criticla section", async () => {
    // resource limit is set to correct resource limit
    await semaphore.run(async () => {});
    expect(semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER)).toBe(1);

    // async func that represents the critical section throw error
    try {
      await semaphore.run(async () => {
        expect(
          semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER),
        ).toBe(0);
        throw new Error();
      });
    } catch (_) {}

    // default limit is increased to default when finish excuting the async func
    expect(semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER)).toBe(1);
  });

  test("The critical section is blocked when previous event havent finish excuting", async () => {
    // try to access semaphore again when resource is current occupied
    let accessed = false;
    void semaphore.run(async () => {
      await sleep(200);
    });
    void semaphore.run(async () => {
      accessed = true;
    });
    await sleep(50);
    expect(semaphore.semaphoreDataStorage.getLimit(DEFAULT_IDENTIFIER)).toBe(0);
    expect(accessed).toBe(false);
    await sleep(200);
    expect(accessed).toBe(true);
  });
});

describe("Multiple identifier on the same semaphore should have their own access resource", () => {
  let semaphore = createNewAsyncSemaphore(1);

  afterEach(() => {
    semaphore = createNewAsyncSemaphore(1);
  });

  test("Different identifier represents different critical section and they are none blocking each other", async () => {
    // try to access semaphore again when resource is current occupied
    let accessedSectionOne = false;
    let accessedSectionTwo = false;

    void semaphore.run(async () => {
      await sleep(200);
      accessedSectionOne = true;
    }, "critical-section-one");
    void semaphore.run(async () => {
      accessedSectionTwo = true;
    }, "critical-section-two");

    await sleep(50);
    expect(
      semaphore.semaphoreDataStorage.getLimit("critical-section-one"),
    ).toBe(0);
    expect(
      semaphore.semaphoreDataStorage.getLimit("critical-section-two"),
    ).toBe(1);
    expect(accessedSectionOne).toBe(false);
    expect(accessedSectionTwo).toBe(true);
    await sleep(200);
    expect(
      semaphore.semaphoreDataStorage.getLimit("critical-section-one"),
    ).toBe(1);
    expect(accessedSectionOne).toBe(true);
  });
});
