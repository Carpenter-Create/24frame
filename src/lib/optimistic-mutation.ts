// House optimistic mutation runner.
// Paint first, persist over fetch, roll back + surface the error on failure.
// Social re-exports this as runSocialOptimisticMutation. Do not fork a
// second apply/await/refresh helper in a workspace.

export type OptimisticRun<T> = {
  apply: () => T;
  persist: () => Promise<{ error?: string }>;
  rollback: (token: T) => void;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  fallback?: string;
};

export function optimisticPersistNotice(cause: unknown, fallback: string): string {
  if (typeof cause === "string" && cause.trim()) return cause;
  if (cause instanceof Error && cause.message.trim()) return cause.message;
  return fallback;
}

export function runOptimisticMutation<T>(input: OptimisticRun<T>): void {
  const token = input.apply();
  void Promise.resolve()
    .then(() => input.persist())
    .then((result) => {
      if (result.error) {
        input.rollback(token);
        input.onError?.(result.error);
        return;
      }
      input.onSuccess?.();
    })
    .catch((cause) => {
      input.rollback(token);
      input.onError?.(optimisticPersistNotice(cause, input.fallback ?? "Save failed."));
    });
}
