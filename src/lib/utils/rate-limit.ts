import { CanceledError } from "../errors";

export type DebouncedFn<Args extends unknown[], R> = ((...args: Args) => Promise<R>) & {
  cancel: (reason?: unknown) => void;
  flush: () => Promise<R | undefined>;
  pending: () => boolean;
};

export function debounce<Args extends unknown[], R>(
  fn: (...args: Args) => R | Promise<R>,
  waitMs: number,
  options?: { leading?: boolean; trailing?: boolean },
): DebouncedFn<Args, Awaited<R>> {
  const leading = options?.leading ?? false;
  const trailing = options?.trailing ?? true;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending:
    | {
        args: Args;
        resolve: (value: Awaited<R>) => void;
        reject: (reason: unknown) => void;
      }
    | undefined;

  const invoke = async () => {
    const p = pending;
    pending = undefined;
    if (!p) return;

    try {
      const value = await fn(...p.args);
      p.resolve(value as Awaited<R>);
    } catch (err) {
      p.reject(err);
    }
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      timer = undefined;
      if (!trailing) {
        if (pending) {
          pending.reject(new CanceledError("Debounced (trailing disabled)"));
          pending = undefined;
        }
        return;
      }
      await invoke();
    }, waitMs);
  };

  const wrapped = ((...args: Args) => {
    const canLead = leading && timer === undefined;
    if (canLead) {
      // Start the timer window; trailing (if any) uses "pending".
      schedule();
      return Promise.resolve(fn(...args)) as Promise<Awaited<R>>;
    }

    if (pending) {
      pending.reject(new CanceledError("Debounced (superseded)"));
      pending = undefined;
    }
    schedule();

    return new Promise<Awaited<R>>((resolve, reject) => {
      pending = { args, resolve, reject };
    });
  }) as DebouncedFn<Args, Awaited<R>>;

  wrapped.cancel = (reason?: unknown) => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (pending) {
      pending.reject(reason ?? new CanceledError("Debounced (canceled)"));
      pending = undefined;
    }
  };

  wrapped.flush = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (!pending) return Promise.resolve(undefined);
    const promise = new Promise<Awaited<R>>((resolve, reject) => {
      const p = pending!;
      pending = { ...p, resolve, reject };
    });
    void invoke();
    return promise;
  };

  wrapped.pending = () => timer !== undefined || pending !== undefined;

  return wrapped;
}

export type ThrottledFn<Args extends unknown[], R> = ((...args: Args) => Promise<R>) & {
  cancel: (reason?: unknown) => void;
  flush: () => Promise<R | undefined>;
  pending: () => boolean;
};

export function throttle<Args extends unknown[], R>(
  fn: (...args: Args) => R | Promise<R>,
  waitMs: number,
  options?: { leading?: boolean; trailing?: boolean },
): ThrottledFn<Args, Awaited<R>> {
  const leading = options?.leading ?? true;
  const trailing = options?.trailing ?? true;

  let lastInvokeAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending:
    | {
        args: Args;
        resolve: (value: Awaited<R>) => void;
        reject: (reason: unknown) => void;
      }
    | undefined;

  const invoke = async () => {
    const p = pending;
    pending = undefined;
    if (!p) return;
    lastInvokeAt = Date.now();
    try {
      const value = await fn(...p.args);
      p.resolve(value as Awaited<R>);
    } catch (err) {
      p.reject(err);
    }
  };

  const scheduleTrailing = (delayMs: number) => {
    if (!trailing) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      timer = undefined;
      await invoke();
    }, delayMs);
  };

  const wrapped = ((...args: Args) => {
    const now = Date.now();
    const elapsed = now - lastInvokeAt;
    const canInvokeNow =
      (lastInvokeAt === 0 && leading) || (lastInvokeAt !== 0 && elapsed >= waitMs);

    if (canInvokeNow) {
      lastInvokeAt = now;
      return Promise.resolve(fn(...args)) as Promise<Awaited<R>>;
    }

    // Inside the throttle window.
    if (!trailing) {
      return Promise.reject(new CanceledError("Throttled")) as Promise<Awaited<R>>;
    }

    if (pending) {
      pending.reject(new CanceledError("Throttled (superseded)"));
      pending = undefined;
    }

    const delay = lastInvokeAt === 0 ? waitMs : Math.max(0, waitMs - elapsed);
    scheduleTrailing(delay);

    return new Promise<Awaited<R>>((resolve, reject) => {
      pending = { args, resolve, reject };
    });
  }) as ThrottledFn<Args, Awaited<R>>;

  wrapped.cancel = (reason?: unknown) => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (pending) {
      pending.reject(reason ?? new CanceledError("Throttled (canceled)"));
      pending = undefined;
    }
  };

  wrapped.flush = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (!pending) return Promise.resolve(undefined);
    const promise = new Promise<Awaited<R>>((resolve, reject) => {
      const p = pending!;
      pending = { ...p, resolve, reject };
    });
    void invoke();
    return promise;
  };

  wrapped.pending = () => timer !== undefined || pending !== undefined;

  return wrapped;
}
