[![npm version](https://badge.fury.io/js/async-resource-semaphore.svg)](https://badge.fury.io/js/async-resource-semaphore)

# Async Resource Semaphore

> A typed semaphore implementation for javascript

JavaScript uses event loop, and with synchronous code, it is confident that two adjacent statements can be executed without context switching.

However, when dealing with promises and asynchronous code, this is no longer the case. When you have an async function that contains other promises or produces multiple events, you create an opportunity for JavaScript to do context switching. See the example below:

```typescript
function main() {
  let data: undefine | Data;
  async function criticalSection() {
    if (data !== undefine) return;
    const res = await axios.post("/tickets");
    data = res.data;
  }

  void criticalSection(); // event B
  void criticalSection(); // event C
}

main(); // event A
```

In this case, the axios.post will be called twice.

1. The main() function call adds event A to the event loop.
2. JavaScript executes event A and produces events B and C.
3. Event B will be executed next after event A finishes. Event B will await axios.post(), allowing JavaScript to execute the next event, which is event C.
4. Event C will await at axios.post(), and JavaScript switches back to event B, assuming 5. axios response is done.
5. Event B finishes executing, sets data.
6. Event C finishes executing, sets data.

This lightweight JavaScript library aims to resolve this issue by creating a critical section that can only be accessed by a set amount of logical chains of events at a given time.

## Usage

### Interface

```typescript
class Semaphore {
  constructor(storageOption: SemaphoreDataStorage): Semaphore;
  run<T>: (criticalSection: () => Promise<T>, identifier?: string): Promise<T>;
  take: (identifier?: string): Promise<void>;
  give: (identifier?: string): void;
}

interface SemaphoreDataStorage {
  getLimit: (identifier: string) => number;
  setLimit: (identifier: string, limit: number) => void;
}


```

### Basic Usage

Default resource counter is set to 1. Only one logical chain of events can access the critical section.

```typescript
import { AsyncSemaphore, SemaphoreDataMemeoryStorage } from "async-resource-semaphore";

const semaphore = new AsyncSemaphore(new SemaphoreDataMemeoryStorage()); // defaut resource counter is 1
const criticalSection = async () => {
  // criticial section
  // ...
};
void semaphore.run(criticalSection);
void semaphore.run(criticalSection); // this event will not excute untill the first one exit
```

You can use semaphore's take and give

```typescript
import { AsyncSemaphore } from "async-resource-semaphore";

const semaphore = new AsyncSemaphore(new SemaphoreDataMemeoryStorage()); // defaut resource counter is 1
const criticalSection = async () => {
  await semaphore.take();
  // criticial section
  // ...
  semaphore.give();
};

void criticalSection();
void criticalSection();
```

When use semaphore's take and give, it is recommended that you use try and catch to handle error inside the critical section to alway return the resource.

If you use semaphore.run() then you dont need to worry about it. This is why run is prefered.

```typescript
// remember to catch error inbetween take and give so it wont block when there is failure
await semaphore.take();
try {
  // criticial section
  // ...
} catch (_) {
  // handle errors
} finally {
  semaphore.give();
}

// or simply use the run()
await semaphore.run(async () => {
  // critical section
});
```

### Initialize a Semaphore with a Custom Resource Limit

```typescript
import { AsyncSemaphore } from "async-resource-semaphore";

const semaphore = new AsyncSemaphore(new SemaphoreDataMemeoryStorage(2)); // critical section can be accessed by at most two logical chain of events
const criticalSection = async () => {
  // criticial section
  // ...
};
void semaphore.run(criticalSection);
void semaphore.run(criticalSection); // this event can excute right away
```

### Get the Resolved Response from criticalSection()

```typescript
import { AsyncSemaphore } from "async-resource-semaphore";

const semaphore = new AsyncSemaphore(new SemaphoreDataMemeoryStorage());
const res = await semaphore.run(async () => "response");
```

### Use Identifier on One Semaphore to Have Multiple Critical Sections with Their Own Resource Limit

```typescript
import { AsyncSemaphore } from "async-resource-semaphore";

const semaphore = new AsyncSemaphore(new SemaphoreDataMemeoryStorage());
void semaphore.run(async () => await axios.post("/tickets", "tickets")); // A
void semaphore.run(async () => await axios.post("/replies", "replies")); // B
void semaphore.run(async () => await axios.post("/replies", "replies")); // C - this one will have to wait for B to exit
```

## License

MIT License

Copyright (c) 2024 Gengyuan Huang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
