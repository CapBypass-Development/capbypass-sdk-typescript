# CapBypass TypeScript/JavaScript SDK

[![npm version](https://badge.fury.io/js/@capbypass%2Fsdk.svg)](https://www.npmjs.com/package/@capbypass/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

Official TypeScript/JavaScript SDK for the CapBypass CAPTCHA solving service. Supports reCAPTCHA v2, reCAPTCHA v3, and AWS WAF challenges.

Works in both Node.js and browser environments.

## Features

- ✅ **Simple API**: One-line `solve()` method or advanced `createTask()`/`getTaskResult()` control
- 🔄 **Automatic Polling**: Built-in adaptive polling with exponential backoff
- 🛡️ **Robust Error Handling**: Typed errors for all API and network failures
- 🔁 **Smart Retry Logic**: Automatic retry on network/gateway errors
- 🎯 **Full TypeScript Support**: Complete type definitions for excellent IDE support
- 🌐 **Universal**: Works in Node.js and browser environments

## Installation

```bash
npm install @capbypass/sdk
```

## Quick Start

### TypeScript

```typescript
import { CapBypassClient, TaskType } from '@capbypass/sdk';

const client = new CapBypassClient({ apiKey: 'your-api-key' });

const solution = await client.solve({
  type: TaskType.RECAPTCHA_V2_PROXYLESS,
  websiteURL: 'https://www.google.com/recaptcha/api2/demo',
  websiteKey: '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
}, 120);

console.log('Token:', solution.gRecaptchaResponse);
```

### JavaScript (CommonJS)

```javascript
const { CapBypassClient, TaskType } = require('@capbypass/sdk');

const client = new CapBypassClient({ apiKey: 'your-api-key' });

client.solve({
  type: TaskType.RECAPTCHA_V2_PROXYLESS,
  websiteURL: 'https://www.google.com/recaptcha/api2/demo',
  websiteKey: '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
}, 120).then(solution => {
  console.log('Token:', solution.gRecaptchaResponse);
});
```

### JavaScript (ES Modules)

```javascript
import { CapBypassClient, TaskType } from '@capbypass/sdk';

const client = new CapBypassClient({ apiKey: 'your-api-key' });

const solution = await client.solve({
  type: TaskType.RECAPTCHA_V2_PROXYLESS,
  websiteURL: 'https://www.google.com/recaptcha/api2/demo',
  websiteKey: '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
}, 120);

console.log('Token:', solution.gRecaptchaResponse);
```

## API Reference

### Client Creation

```typescript
import { CapBypassClient } from '@capbypass/sdk';

// With API key parameter
const client = new CapBypassClient({ apiKey: 'your-api-key' });

// From CAPBYPASS_API_KEY environment variable
const client = new CapBypassClient();

// With custom base URL
const client = new CapBypassClient({
  apiKey: 'your-api-key',
  baseURL: 'https://custom-gateway.example.com'
});
```

### Simple API (Recommended)

**solve()** - One-step CAPTCHA solving:

```typescript
const solution = await client.solve(task, timeout);
```

- `task`: Task configuration (see Task Types below)
- `timeout`: Maximum wait time in seconds (default: 120)
- Returns: Promise<Solution>

### Advanced API

For full control over task lifecycle:

```typescript
// Create task
const taskId = await client.createTask(task);

// Poll for result
const result = await client.getTaskResult(taskId);

// Check balance
const balance = await client.getBalance();
```

## Task Types

### reCAPTCHA v2

```typescript
const solution = await client.solve({
  type: TaskType.RECAPTCHA_V2_PROXYLESS,
  websiteURL: 'https://example.com',
  websiteKey: '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
}, 120);
```

**Invisible reCAPTCHA v2:**

```typescript
const solution = await client.solve({
  type: TaskType.RECAPTCHA_V2_PROXYLESS,
  websiteURL: 'https://example.com',
  websiteKey: '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
  isInvisible: true,
}, 120);
```

### reCAPTCHA v3

```typescript
const solution = await client.solve({
  type: TaskType.RECAPTCHA_V3_PROXYLESS,
  websiteURL: 'https://example.com',
  websiteKey: '6LcR_okUAAAAAPYrPe-HK_0RULO1aZM15ENyM-Mf',
  pageAction: 'submit',
}, 120);
```

### AWS WAF Challenge

```typescript
const solution = await client.solve({
  type: TaskType.ANTI_AWS_WAF_PROXYLESS,
  websiteURL: 'https://example.com',
  awsChallengeJS: 'https://[...].awswaf.com/[...]/challenge.js',
}, 120);
```

### With Proxy

All task types support proxy configuration:

```typescript
const solution = await client.solve({
  type: TaskType.RECAPTCHA_V2,
  websiteURL: 'https://example.com',
  websiteKey: '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
  proxyType: 'http',
  proxyAddress: 'proxy.example.com',
  proxyPort: 8080,
  proxyLogin: 'username',
  proxyPassword: 'password',
}, 120);
```

## Error Handling

The SDK uses typed errors for precise error handling:

```typescript
import {
  AuthenticationError,
  InsufficientBalanceError,
  ValidationError,
  TimeoutError,
  SolverError,
  NetworkError,
  GatewayError,
} from '@capbypass/sdk';

try {
  const solution = await client.solve(task, 120);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid API key
  } else if (error instanceof InsufficientBalanceError) {
    // No balance
  } else if (error instanceof ValidationError) {
    // Invalid task parameters
  } else if (error instanceof TimeoutError) {
    // Task took too long
  } else if (error instanceof SolverError) {
    // CAPTCHA could not be solved
  } else if (error instanceof NetworkError) {
    // Network/connection error
  } else if (error instanceof GatewayError) {
    // Gateway error (502/503/504)
  }
}
```

## Task Type Constants

```typescript
TaskType.ANTI_AWS_WAF                    // AntiAwsWafTask
TaskType.ANTI_AWS_WAF_PROXYLESS          // AntiAwsWafTaskProxyLess
TaskType.RECAPTCHA_V2                    // ReCaptchaV2Task
TaskType.RECAPTCHA_V2_PROXYLESS          // ReCaptchaV2TaskProxyLess
TaskType.RECAPTCHA_V3                    // ReCaptchaV3Task
TaskType.RECAPTCHA_V3_PROXYLESS          // ReCaptchaV3TaskProxyLess
TaskType.RECAPTCHA_V3_ENTERPRISE         // ReCaptchaV3EnterpriseTask
TaskType.RECAPTCHA_V3_ENTERPRISE_PROXYLESS  // ReCaptchaV3EnterpriseTaskProxyLess
```

## Documentation

### 📚 Core Documentation
- [Quick Start Guide](https://github.com/CapBypass-Development/capbypass-sdks/blob/main/docs/quickstart/typescript.md)
- [Complete API Reference](https://github.com/CapBypass-Development/capbypass-sdks/blob/main/docs/api-reference/typescript-sdk.md)
- [Full SDK Documentation](https://capbypass.dev/docs/sdks/typescript)

### 🔧 Advanced Guides
- [Proxy Configuration](https://github.com/CapBypass-Development/capbypass-sdks/blob/main/docs/guides/proxy-configuration.md) — HTTP, HTTPS, SOCKS5 proxy support with rotation strategies
- [Error Handling](https://github.com/CapBypass-Development/capbypass-sdks/blob/main/docs/guides/error-handling.md) — Retry strategies, circuit breakers, production alerting
- [Performance Optimization](https://github.com/CapBypass-Development/capbypass-sdks/blob/main/docs/guides/performance-optimization.md) — Concurrent solving, connection pooling, token caching
- [Production Deployment](https://github.com/CapBypass-Development/capbypass-sdks/blob/main/docs/guides/production-deployment.md) — Kubernetes, AWS Lambda, monitoring, security

### 🔄 Migration
- [Migrating from Capsolver](https://github.com/CapBypass-Development/capbypass-sdks/blob/main/docs/migration/from-capsolver.md) — 100% API compatible, drop-in replacement

## Examples

### Basic Examples
See the [examples](examples/) directory for complete runnable examples:
- [recaptcha-v2.ts](examples/recaptcha-v2.ts) - reCAPTCHA v2 solving
- [recaptcha-v3.ts](examples/recaptcha-v3.ts) - reCAPTCHA v3 solving
- [aws-waf.ts](examples/aws-waf.ts) - AWS WAF challenge solving

### Advanced Examples
Full integration examples in the [documentation](https://github.com/CapBypass-Development/capbypass-sdks/tree/main/docs/examples):
- E-commerce checkout automation
- Social media automation
- Web scraping with CAPTCHA handling
- Microservice integration patterns

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
# Build the package
npm run build

# This generates:
# - dist/index.js (CommonJS)
# - dist/index.mjs (ES Module)
# - dist/index.d.ts (TypeScript declarations)
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [Documentation](https://capbypass.dev/docs/sdks/typescript)
- [npm Package](https://www.npmjs.com/package/@capbypass/sdk)
- [GitHub Repository](https://github.com/CapBypass-Development/capbypass-sdk-typescript)
- [Bug Reports](https://github.com/CapBypass-Development/capbypass-sdk-typescript/issues)
