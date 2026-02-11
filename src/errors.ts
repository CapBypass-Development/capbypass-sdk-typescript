/**
 * Base CapBypass error with Capsolver-compatible structure
 */
export class CapBypassError extends Error {
  public readonly errorId?: number;
  public readonly errorCode?: string;
  public readonly errorDescription?: string;

  constructor(errorCode?: string, errorDescription?: string, errorId?: number) {
    super(errorDescription || errorCode || 'Unknown error');
    this.name = this.constructor.name;
    this.errorId = errorId;
    this.errorCode = errorCode;
    this.errorDescription = errorDescription;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Capsolver API Errors
 */

/**
 * Authentication error - invalid API key
 */
export class AuthenticationError extends CapBypassError {
  constructor(errorCode: string, errorDescription: string) {
    super(errorCode, errorDescription, 1);
  }
}

/**
 * Insufficient balance error
 */
export class InsufficientBalanceError extends CapBypassError {
  constructor(errorCode: string, errorDescription: string) {
    super(errorCode, errorDescription, 1);
  }
}

/**
 * Validation error - invalid task data
 */
export class ValidationError extends CapBypassError {
  constructor(errorCode: string, errorDescription: string) {
    super(errorCode, errorDescription, 1);
  }
}

/**
 * Task not found error
 */
export class TaskNotFoundError extends CapBypassError {
  constructor(errorCode: string, errorDescription: string) {
    super(errorCode, errorDescription, 16);
  }
}

/**
 * Solver error - CAPTCHA could not be solved
 */
export class SolverError extends CapBypassError {
  constructor(errorDescription: string) {
    super('SOLVER_FAILED', errorDescription, 0);
  }
}

/**
 * Timeout error - task solving exceeded timeout
 */
export class TimeoutError extends CapBypassError {
  constructor() {
    super('TIMEOUT', 'Task solving timed out', 0);
  }
}

/**
 * Internal server error
 */
export class InternalError extends CapBypassError {
  constructor(errorCode: string, errorDescription: string) {
    super(errorCode, errorDescription, 1);
  }
}

/**
 * HTTP-Layer Errors
 */

/**
 * Network connection error
 */
export class NetworkError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(`Network error: ${message}`);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Gateway error (HTTP 502/503/504)
 */
export class GatewayError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(`Gateway error: HTTP ${statusCode} - ${message}`);
    this.name = 'GatewayError';
    Object.setPrototypeOf(this, GatewayError.prototype);
  }
}

/**
 * Server error (HTTP 500)
 */
export class ServerError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(`Server error: HTTP ${statusCode} - ${message}`);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Rate limit error (HTTP 429)
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(`Rate limit exceeded: ${message}`);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Parse error - JSON parsing failed
 */
export class ParseError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(`Parse error: ${message}`);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Parse API error response and throw appropriate error
 */
export function parseError(errorCode: string, errorDescription: string): never {
  switch (errorCode) {
    case 'ERROR_KEY_DOES_NOT_EXIST':
    case 'ERROR_KEY_DENIED_ACCESS':
      throw new AuthenticationError(errorCode, errorDescription);

    case 'ERROR_ZERO_BALANCE':
    case 'ERROR_NO_SLOT_AVAILABLE':
      throw new InsufficientBalanceError(errorCode, errorDescription);

    case 'ERROR_INVALID_TASK_DATA':
    case 'ERROR_TASK_ABSENT':
    case 'ERROR_TASK_NOT_SUPPORTED':
    case 'TASK_TYPE_COMING_SOON':
    case 'TASK_TYPE_INACTIVE':
      throw new ValidationError(errorCode, errorDescription);

    case 'ERROR_TASK_NOT_FOUND':
      throw new TaskNotFoundError(errorCode, errorDescription);

    default:
      throw new InternalError(errorCode, errorDescription);
  }
}
