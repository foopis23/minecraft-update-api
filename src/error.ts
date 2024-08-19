import { t } from "elysia";

export class FetchError extends Error {
  constructor(
    public readonly code: number,
    public readonly status: string,
    public readonly body: string
  ) {
    super(`FetchError: ${status} (${code})\n${body}`);
  }
}

export const errorResponseSchema = t.Object({
  message: t.String(),
  code: t.Number(),
  status: t.String(),
});

export const STATUS_CODES = {
  200: 'OK',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
};

export function errorResponse(error: Error, status: keyof typeof STATUS_CODES) {
  return {
    message: error.toString(),
    code: status,
    status: STATUS_CODES[status],
  };
};
