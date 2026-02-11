import axios from 'axios';
import { CapBypassClient } from './client';
import { TaskType } from './types';
import {
  AuthenticationError,
  InsufficientBalanceError,
  InternalError,
  ValidationError,
  TaskNotFoundError,
  SolverError,
  TimeoutError,
  GatewayError,
  NetworkError,
  RateLimitError,
  ServerError,
} from './errors';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CapBypassClient', () => {
  let client: CapBypassClient;
  let mockPost: jest.Mock;
  let mockGet: jest.Mock;

  beforeEach(() => {
    mockPost = jest.fn();
    mockGet = jest.fn();
    const mockAxiosInstance: any = {
      post: mockPost,
      get: mockGet,
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    client = new CapBypassClient({ apiKey: 'test-key' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with API key', () => {
      expect(client).toBeInstanceOf(CapBypassClient);
    });

    it('should use environment variable if no API key provided', () => {
      process.env.CAPBYPASS_API_KEY = 'env-key';
      const envClient = new CapBypassClient();
      expect(envClient).toBeInstanceOf(CapBypassClient);
      delete process.env.CAPBYPASS_API_KEY;
    });

    it('should throw error if no API key', () => {
      expect(() => new CapBypassClient()).toThrow('API key is required');
    });
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 0,
          taskId: 'test-task-id-123',
        },
      });

      const taskId = await client.createTask({
        type: TaskType.RECAPTCHA_V2_PROXYLESS,
        websiteURL: 'https://example.com',
        websiteKey: 'test-key',
      });

      expect(taskId).toBe('test-task-id-123');
    });

    it('should throw AuthenticationError on invalid API key', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 1,
          errorCode: 'ERROR_KEY_DOES_NOT_EXIST',
          errorDescription: 'Account not found',
        },
      });

      await expect(
        client.createTask({ type: TaskType.RECAPTCHA_V2_PROXYLESS })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw InsufficientBalanceError on zero balance', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 1,
          errorCode: 'ERROR_ZERO_BALANCE',
          errorDescription: 'Insufficient balance',
        },
      });

      await expect(
        client.createTask({ type: TaskType.RECAPTCHA_V2_PROXYLESS })
      ).rejects.toThrow(InsufficientBalanceError);
    });

    it('should throw ValidationError on invalid task data', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 1,
          errorCode: 'ERROR_INVALID_TASK_DATA',
          errorDescription: 'Invalid task type',
        },
      });

      await expect(
        client.createTask({ type: 'InvalidTaskType' as any })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getTaskResult', () => {
    it('should get processing status', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 0,
          status: 'processing',
        },
      });

      const result = await client.getTaskResult('test-task-id');
      expect(result.status).toBe('processing');
    });

    it('should get ready status with solution', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 0,
          status: 'ready',
          solution: {
            gRecaptchaResponse: 'test-token',
          },
        },
      });

      const result = await client.getTaskResult('test-task-id');
      expect(result.status).toBe('ready');
      expect(result.solution?.gRecaptchaResponse).toBe('test-token');
    });

    it('should throw TaskNotFoundError', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 16,
          errorCode: 'ERROR_TASK_NOT_FOUND',
          errorDescription: 'Task not found',
        },
      });

      await expect(
        client.getTaskResult('invalid-task-id')
      ).rejects.toThrow(TaskNotFoundError);
    });
  });

  describe('getBalance', () => {
    it('should get balance successfully', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 0,
          balance: 42.5,
        },
      });

      const balance = await client.getBalance();
      expect(balance).toBe(42.5);
    });

    it('should throw InternalError on unknown error code', async () => {
      mockPost.mockResolvedValue({
        data: {
          errorId: 1,
          errorCode: 'ERROR_UNKNOWN',
          errorDescription: 'Something went wrong',
        },
      });

      await expect(client.getBalance()).rejects.toThrow(InternalError);
    });
  });

  describe('solve', () => {
    it('should solve task successfully', async () => {
      mockPost
        .mockResolvedValueOnce({
          data: {
            errorId: 0,
            taskId: 'test-task-id',
          },
        })
        .mockResolvedValueOnce({
          data: {
            errorId: 0,
            status: 'processing',
          },
        })
        .mockResolvedValueOnce({
          data: {
            errorId: 0,
            status: 'ready',
            solution: {
              gRecaptchaResponse: 'solved-token',
            },
          },
        });

      const solution = await client.solve({
        type: TaskType.RECAPTCHA_V2_PROXYLESS,
        websiteURL: 'https://example.com',
        websiteKey: 'test-key',
      });

      expect(solution.gRecaptchaResponse).toBe('solved-token');
    });

    it('should throw SolverError when task fails', async () => {
      mockPost
        .mockResolvedValueOnce({
          data: {
            errorId: 0,
            taskId: 'test-task-id',
          },
        })
        .mockResolvedValueOnce({
          data: {
            errorId: 0,
            status: 'failed',
            errorDescription: 'CAPTCHA unsolvable',
          },
        });

      await expect(
        client.solve({ type: TaskType.RECAPTCHA_V2_PROXYLESS })
      ).rejects.toThrow(SolverError);
    });

    it('should throw TimeoutError on timeout', async () => {
      mockPost
        .mockResolvedValueOnce({
          data: {
            errorId: 0,
            taskId: 'test-task-id',
          },
        })
        .mockResolvedValue({
          data: {
            errorId: 0,
            status: 'processing',
          },
        });

      await expect(
        client.solve({ type: TaskType.RECAPTCHA_V2_PROXYLESS }, 3)
      ).rejects.toThrow(TimeoutError);
    }, 10000);
  });

  describe('retry logic', () => {
    it('should retry on gateway error', async () => {
      mockPost
        .mockRejectedValueOnce({
          response: { status: 503, data: 'Service unavailable' },
        })
        .mockResolvedValueOnce({
          data: {
            errorId: 0,
            balance: 10.0,
          },
        });

      const balance = await client.getBalance();
      expect(balance).toBe(10.0);
    });

    it('should throw GatewayError after max retries', async () => {
      mockPost.mockRejectedValue({
        response: { status: 503, data: 'Service unavailable' },
      });

      await expect(client.getBalance()).rejects.toThrow(GatewayError);
    }, 15000);

    it('should throw RateLimitError on HTTP 429', async () => {
      mockPost.mockRejectedValue({
        response: { status: 429, data: 'Too many requests' },
      });

      await expect(client.getBalance()).rejects.toThrow(RateLimitError);
    });

    it('should throw ServerError on HTTP 500', async () => {
      mockPost.mockRejectedValue({
        response: { status: 500, data: 'Internal server error' },
      });

      await expect(client.getBalance()).rejects.toThrow(ServerError);
    });

    it('should throw NetworkError on generic 4xx error', async () => {
      mockPost.mockRejectedValue({
        response: { status: 403, data: 'Forbidden' },
      });

      await expect(client.getBalance()).rejects.toThrow(NetworkError);
    });

    it('should retry on ECONNREFUSED and throw NetworkError after max retries', async () => {
      mockPost.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
      });

      await expect(client.getBalance()).rejects.toThrow(NetworkError);
    }, 30000);

    it('should retry on ETIMEDOUT and throw NetworkError after max retries', async () => {
      mockPost.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'connect ETIMEDOUT',
      });

      await expect(client.getBalance()).rejects.toThrow(NetworkError);
    }, 30000);

    it('should recover after ECONNREFUSED retry', async () => {
      mockPost
        .mockRejectedValueOnce({
          code: 'ECONNREFUSED',
          message: 'connect ECONNREFUSED',
        })
        .mockResolvedValueOnce({
          data: { errorId: 0, balance: 5.0 },
        });

      const balance = await client.getBalance();
      expect(balance).toBe(5.0);
    }, 15000);

    it('should throw NetworkError on unknown network failure', async () => {
      mockPost.mockRejectedValue({
        message: 'socket hang up',
      });

      await expect(client.getBalance()).rejects.toThrow(NetworkError);
    });
  });

  describe('getPricing', () => {
    it('should get pricing successfully', async () => {
      mockGet.mockResolvedValue({
        data: {
          pricing: [
            { task_type: 'ReCaptchaV2Task', user_cost: 1.5, status: 'active' },
            { task_type: 'AntiAwsWafTask', user_cost: 2.0, status: 'active' },
          ],
        },
      });

      const pricing = await client.getPricing();
      expect(pricing).toHaveLength(2);
      expect(pricing[0].task_type).toBe('ReCaptchaV2Task');
      expect(pricing[0].user_cost).toBe(1.5);
    });

    it('should retry on gateway error and succeed', async () => {
      mockGet
        .mockRejectedValueOnce({
          response: { status: 502, data: 'Bad gateway' },
        })
        .mockResolvedValueOnce({
          data: {
            pricing: [{ task_type: 'ReCaptchaV2Task', user_cost: 1.0, status: 'active' }],
          },
        });

      const pricing = await client.getPricing();
      expect(pricing).toHaveLength(1);
    }, 15000);

    it('should throw GatewayError after max retries', async () => {
      mockGet.mockRejectedValue({
        response: { status: 504, data: 'Gateway timeout' },
      });

      await expect(client.getPricing()).rejects.toThrow(GatewayError);
    }, 30000);

    it('should retry on ECONNREFUSED and throw NetworkError', async () => {
      mockGet.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED',
      });

      await expect(client.getPricing()).rejects.toThrow(NetworkError);
    }, 30000);

    it('should throw NetworkError on unknown error', async () => {
      mockGet.mockRejectedValue({
        message: 'unexpected error',
      });

      await expect(client.getPricing()).rejects.toThrow(NetworkError);
    });
  });
});
