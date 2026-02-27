# Logger Service

The LoggerService provides structured logging using Winston and error tracking with Sentry.

## Usage

Import the logger instance:

```typescript
import { logger } from '@/lib/infrastructure/logger.service';
// or via legacy path (deprecated but supported)
import { logger } from '@/lib/logger';
```

### Logging Methods

**Info**
```typescript
logger.info('User logged in', { userId: '123' });
```

**Debug**
```typescript
logger.debug('Processing order items', { items: [...] });
```

**Warn**
```typescript
logger.warn('Retry attempt failed', { attempt: 2 }, errorObject);
```

**Error**
```typescript
logger.error('Payment failed', errorObject, { orderId: '456' });
```

## Configuration

Environment variables:

- `LOG_LEVEL`: 'debug', 'info', 'warn', 'error' (default: 'info' in prod, 'debug' in dev)
- `LOG_TO_FILE`: 'true' to enable file logging (logs/application-*.log)
- `SENTRY_DSN`: Sentry DSN for error tracking
- `NODE_ENV`: 'production' enables JSON logging and Sentry integration

## Implementation Details

- **Winston**: Used for logging transport (Console, File).
- **Sentry**: Used for error tracking and performance monitoring.
- **Context**: Structured logging allows passing contextual information as the second argument.
- **Singleton**: The service is a singleton instance.
