interface ApiErrorBody {
  error?: string;
  details?: { message: string }[];
}

/** Human-readable message from an RTK Query error (`{ status, data: { error, details } }`). */
export function apiErrorText(err: unknown, fallback = 'Something went wrong'): string {
  const { status, data } = (err ?? {}) as { status?: number | string; data?: ApiErrorBody };
  if (status === 401) return 'Please sign in to continue';
  if (status === 'FETCH_ERROR') return 'The store server is unavailable. Please try again in a minute.';
  return data?.details?.[0]?.message ?? data?.error ?? fallback;
}
