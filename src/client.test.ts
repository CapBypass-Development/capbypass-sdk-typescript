import axios from 'axios';
import { CapBypassClient } from './client';
import { TaskType } from './types';
import {
  AuthenticationError,
  InsufficientBalanceError,
  ValidationError,
  TaskNotFoundError,
  SolverError,
  TimeoutError,
  GatewayError,
} from './errors';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CapBypassClient', () => {
  let client: CapBypassClient;
  let mockPost: jest.Mock;

  beforeEach(() => {
    mockPost = jest.fn();
    const mockAxiosInstance: any = {
      post: mockPost,
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
  });
});
