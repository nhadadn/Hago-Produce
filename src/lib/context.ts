
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string | undefined {
  const store = requestContext.getStore();
  return store?.correlationId;
}
