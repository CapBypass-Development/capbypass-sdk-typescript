import {
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
  parseError,
} from './errors';

describe('CapBypass Errors', () => {
  describe('CapBypassError', () => {
    it('should create with all fields', () => {
      const err = new CapBypassError('CODE', 'description', 1);
      expect(err.message).toBe('description');
      expect(err.errorCode).toBe('CODE');
      expect(err.errorDescription).toBe('description');
      expect(err.errorId).toBe(1);
      expect(err).toBeInstanceOf(Error);
    });

    it('should fallback to errorCode when no description', () => {
      const err = new CapBypassError('CODE');
      expect(err.message).toBe('CODE');
    });

    it('should fallback to "Unknown error" when no args', () => {
      const err = new CapBypassError();
      expect(err.message).toBe('Unknown error');
    });
  });

  describe('API error classes', () => {
    it('AuthenticationError has errorId 1', () => {
      const err = new AuthenticationError('ERROR_KEY_DOES_NOT_EXIST', 'bad key');
      expect(err.errorId).toBe(1);
      expect(err).toBeInstanceOf(CapBypassError);
    });

    it('InsufficientBalanceError has errorId 1', () => {
      const err = new InsufficientBalanceError('ERROR_ZERO_BALANCE', 'no balance');
      expect(err.errorId).toBe(1);
    });

    it('ValidationError has errorId 1', () => {
      const err = new ValidationError('ERROR_INVALID_TASK_DATA', 'bad data');
      expect(err.errorId).toBe(1);
    });

    it('TaskNotFoundError has errorId 16', () => {
      const err = new TaskNotFoundError('ERROR_TASK_NOT_FOUND', 'not found');
      expect(err.errorId).toBe(16);
    });

    it('SolverError has errorId 0', () => {
      const err = new SolverError('failed to solve');
      expect(err.errorId).toBe(0);
      expect(err.errorCode).toBe('SOLVER_FAILED');
    });

    it('TimeoutError has errorId 0', () => {
      const err = new TimeoutError();
      expect(err.errorId).toBe(0);
      expect(err.errorCode).toBe('TIMEOUT');
    });

    it('InternalError has errorId 1', () => {
      const err = new InternalError('ERROR_INTERNAL', 'server error');
      expect(err.errorId).toBe(1);
    });
  });

  describe('HTTP error classes', () => {
    it('NetworkError preserves cause', () => {
      const cause = new Error('socket hang up');
      const err = new NetworkError('connection failed', cause);
      expect(err.message).toBe('Network error: connection failed');
      expect(err.cause).toBe(cause);
      expect(err.name).toBe('NetworkError');
      expect(err).toBeInstanceOf(NetworkError);
    });

    it('GatewayError preserves status code', () => {
      const err = new GatewayError(502, 'Bad Gateway');
      expect(err.message).toBe('Gateway error: HTTP 502 - Bad Gateway');
      expect(err.statusCode).toBe(502);
      expect(err.name).toBe('GatewayError');
      expect(err).toBeInstanceOf(GatewayError);
    });

    it('ServerError preserves status code', () => {
      const err = new ServerError(500, 'Internal Server Error');
      expect(err.message).toBe('Server error: HTTP 500 - Internal Server Error');
      expect(err.statusCode).toBe(500);
      expect(err.name).toBe('ServerError');
      expect(err).toBeInstanceOf(ServerError);
    });

    it('RateLimitError formats message', () => {
      const err = new RateLimitError('slow down');
      expect(err.message).toBe('Rate limit exceeded: slow down');
      expect(err.name).toBe('RateLimitError');
      expect(err).toBeInstanceOf(RateLimitError);
    });

    it('ParseError preserves cause', () => {
      const cause = new SyntaxError('Unexpected token');
      const err = new ParseError('invalid JSON', cause);
      expect(err.message).toBe('Parse error: invalid JSON');
      expect(err.cause).toBe(cause);
      expect(err.name).toBe('ParseError');
      expect(err).toBeInstanceOf(ParseError);
    });
  });

  describe('parseError', () => {
    // Codes mirror the gateway contract in @solver-platform/shared errors.ts.
    it('throws AuthenticationError for ERROR_KEY_DOES_NOT_EXIST', () => {
      expect(() => parseError('ERROR_KEY_DOES_NOT_EXIST', 'bad key')).toThrow(AuthenticationError);
    });

    it('throws InsufficientBalanceError for ERROR_ZERO_BALANCE', () => {
      expect(() => parseError('ERROR_ZERO_BALANCE', 'no balance')).toThrow(InsufficientBalanceError);
    });

    it('throws ValidationError for ERROR_INVALID_TASK_DATA', () => {
      expect(() => parseError('ERROR_INVALID_TASK_DATA', 'bad data')).toThrow(ValidationError);
    });

    it('throws ValidationError for ERROR_INVALID_DEVELOPER_KEY', () => {
      expect(() => parseError('ERROR_INVALID_DEVELOPER_KEY', 'invalid developer key')).toThrow(ValidationError);
    });

    it('throws ValidationError for ERROR_PROXY_NOT_DEFINED', () => {
      expect(() => parseError('ERROR_PROXY_NOT_DEFINED', 'proxy required')).toThrow(ValidationError);
    });

    it('throws ValidationError for ERROR_WRONG_TASK_TYPE', () => {
      expect(() => parseError('ERROR_WRONG_TASK_TYPE', 'wrong type')).toThrow(ValidationError);
    });

    it('throws ValidationError for ERROR_TASK_TYPE_COMING_SOON', () => {
      expect(() => parseError('ERROR_TASK_TYPE_COMING_SOON', 'coming soon')).toThrow(ValidationError);
    });

    it('throws ValidationError for ERROR_TASK_TYPE_INACTIVE', () => {
      expect(() => parseError('ERROR_TASK_TYPE_INACTIVE', 'inactive')).toThrow(ValidationError);
    });

    it('throws TaskNotFoundError for ERROR_TASK_NOT_FOUND', () => {
      expect(() => parseError('ERROR_TASK_NOT_FOUND', 'not found')).toThrow(TaskNotFoundError);
    });

    it('throws SolverError for ERROR_CAPTCHA_UNSOLVABLE', () => {
      expect(() => parseError('ERROR_CAPTCHA_UNSOLVABLE', 'unsolvable')).toThrow(SolverError);
    });

    it('throws TimeoutError for ERROR_TIMEOUT', () => {
      expect(() => parseError('ERROR_TIMEOUT', 'timed out')).toThrow(TimeoutError);
    });

    it('throws InternalError for ERROR_TASK_QUEUE_FULL', () => {
      expect(() => parseError('ERROR_TASK_QUEUE_FULL', 'at capacity')).toThrow(InternalError);
    });

    it('throws InternalError for unknown error codes', () => {
      expect(() => parseError('UNKNOWN_CODE', 'something broke')).toThrow(InternalError);
    });
  });
});
