export class FetchError extends Error {
  constructor(
    public readonly code: number,
    public readonly status: string,
    public readonly body: string
  ) {
    super(`FetchError: ${status} (${code})\n${body}`);
  }
}
