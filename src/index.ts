/**
 * CapBypass TypeScript/JavaScript SDK
 * Official SDK for CapBypass CAPTCHA solving service
 */

export { CapBypassClient } from './client';
export { TaskType } from './types';
export type {
  BaseTask,
  ProxyConfig,
  TaskResult,
  ClientOptions,
  TaskTypeValue,
} from './types';
export {
  CapBypassError,
  AuthenticationError,
  InsufficientBalanceError,
  ValidationError,
  TaskNotFoundError,
  SolverError,
  TimeoutError,
  InternalError,
  NetworkError,
  GatewayError,
  ServerError,
  RateLimitError,
  ParseError,
} from './errors';
