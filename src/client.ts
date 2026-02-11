import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  BaseTask,
  ClientOptions,
  CreateTaskRequest,
  CreateTaskResponse,
  GetBalanceRequest,
  GetBalanceResponse,
  GetTaskResultRequest,
  PricingItem,
  PricingResponse,
  TaskResult,
} from './types';
import {
  parseError,
  GatewayError,
  NetworkError,
  ParseError,
  RateLimitError,
  ServerError,
  SolverError,
  TimeoutError,
} from './errors';

const DEFAULT_BASE_URL = 'https://api.capbypass.pro';
const SDK_VERSION = '1.0.0';
const USER_AGENT = `capbypass-sdk-typescript/${SDK_VERSION}`;

/**
 * CapBypass API Client
 */
export class CapBypassClient {
  private apiKey: string;
  private httpClient: AxiosInstance;

  /**
   * Create a new CapBypass client
   * @param options - Client configuration options
   */
  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey || process.env.CAPBYPASS_API_KEY || '';

    if (!this.apiKey) {
      throw new Error(
        'API key is required. Provide via constructor or CAPBYPASS_API_KEY environment variable.'
      );
    }

    this.httpClient = axios.create({
      baseURL: options.baseURL || DEFAULT_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
    });
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    payload: any,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.httpClient.post<T>(endpoint, payload);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;

        // Handle gateway errors with retry
        if (
          axiosError.response &&
          [502, 503, 504].includes(axiosError.response.status)
        ) {
          if (attempt < maxRetries) {
            const backoff =
              Math.min(10, Math.pow(2, attempt)) + Math.random();
            await this.sleep(backoff * 1000);
            continue;
          }
          throw new GatewayError(
            axiosError.response.status,
            axiosError.response.data as string
          );
        }

        // Handle other HTTP errors
        if (axiosError.response) {
          if (axiosError.response.status === 429) {
            throw new RateLimitError(axiosError.response.data as string);
          }
          if (axiosError.response.status === 500) {
            throw new ServerError(
              axiosError.response.status,
              axiosError.response.data as string
            );
          }
          if (axiosError.response.status >= 400) {
            throw new NetworkError(
              `HTTP ${axiosError.response.status}: ${axiosError.response.data}`,
              axiosError
            );
          }
        }

        // Handle network errors with retry
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
          if (attempt < maxRetries) {
            const backoff =
              Math.min(10, Math.pow(2, attempt)) + Math.random();
            await this.sleep(backoff * 1000);
            lastError = new NetworkError('Connection failed', axiosError);
            continue;
          }
          throw new NetworkError('Connection failed', axiosError);
        }

        throw new NetworkError(axiosError.message, axiosError);
      }
    }

    throw lastError!;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create a new CAPTCHA solving task
   * @param task - Task configuration
   * @returns Task ID
   */
  async createTask(task: BaseTask): Promise<string> {
    const request: CreateTaskRequest = {
      clientKey: this.apiKey,
      task,
    };

    const response = await this.makeRequest<CreateTaskResponse>(
      '/createTask',
      request
    );

    if (response.errorId !== 0) {
      parseError(response.errorCode!, response.errorDescription!);
    }

    return response.taskId!;
  }

  /**
   * Get the result of a task
   * @param taskId - Task ID from createTask
   * @returns Task result
   */
  async getTaskResult(taskId: string): Promise<TaskResult> {
    const request: GetTaskResultRequest = {
      clientKey: this.apiKey,
      taskId,
    };

    const response = await this.makeRequest<TaskResult>(
      '/getTaskResult',
      request
    );

    if (response.errorId !== 0) {
      parseError(response.errorCode!, response.errorDescription!);
    }

    return response;
  }

  /**
   * Get pricing for all task types.
   * This is a public endpoint and does not require authentication.
   * @returns Array of pricing items with task_type and user_cost
   */
  async getPricing(): Promise<PricingItem[]> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        const response = await this.httpClient.get<PricingResponse>('/pricing');
        return response.data.pricing;
      } catch (error) {
        const axiosError = error as AxiosError;

        if (
          axiosError.response &&
          [502, 503, 504].includes(axiosError.response.status)
        ) {
          if (attempt < 3) {
            const backoff =
              Math.min(10, Math.pow(2, attempt)) + Math.random();
            await this.sleep(backoff * 1000);
            continue;
          }
          throw new GatewayError(
            axiosError.response.status,
            axiosError.response.data as string
          );
        }

        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ETIMEDOUT') {
          if (attempt < 3) {
            const backoff =
              Math.min(10, Math.pow(2, attempt)) + Math.random();
            await this.sleep(backoff * 1000);
            lastError = new NetworkError('Connection failed', axiosError);
            continue;
          }
          throw new NetworkError('Connection failed', axiosError);
        }

        throw new NetworkError(axiosError.message, axiosError);
      }
    }

    throw lastError!;
  }

  /**
   * Get account balance
   * @returns Account balance
   */
  async getBalance(): Promise<number> {
    const request: GetBalanceRequest = {
      clientKey: this.apiKey,
    };

    const response = await this.makeRequest<GetBalanceResponse>(
      '/getBalance',
      request
    );

    if (response.errorId !== 0) {
      parseError(response.errorCode!, response.errorDescription!);
    }

    return response.balance!;
  }

  /**
   * Create a task and poll until solved or timeout
   * @param task - Task configuration
   * @param timeout - Maximum wait time in seconds (default: 120)
   * @returns Solution object
   */
  async solve(
    task: BaseTask,
    timeout: number = 120
  ): Promise<Record<string, any>> {
    const taskId = await this.createTask(task);
    const startTime = Date.now();
    let attempt = 0;

    while (true) {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > timeout) {
        throw new TimeoutError();
      }

      const result = await this.getTaskResult(taskId);

      if (result.status === 'ready') {
        return result.solution!;
      }

      if (result.status === 'failed') {
        throw new SolverError(
          result.errorDescription || 'Task failed'
        );
      }

      // Adaptive polling: min(5, ceil(attempt / 2))
      attempt++;
      const pollInterval = Math.min(5, Math.ceil(attempt / 2));
      await this.sleep(pollInterval * 1000);
    }
  }
}
