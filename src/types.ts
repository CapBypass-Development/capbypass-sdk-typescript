/**
 * Task type constants for CapBypass API
 */
export const TaskType = {
  // AWS WAF
  ANTI_AWS_WAF: 'AntiAwsWafTask',
  ANTI_AWS_WAF_PROXYLESS: 'AntiAwsWafTaskProxyLess',

  // reCAPTCHA v2
  RECAPTCHA_V2: 'ReCaptchaV2Task',
  RECAPTCHA_V2_PROXYLESS: 'ReCaptchaV2TaskProxyLess',

  // reCAPTCHA v3
  RECAPTCHA_V3: 'ReCaptchaV3Task',
  RECAPTCHA_V3_PROXYLESS: 'ReCaptchaV3TaskProxyLess',

  // reCAPTCHA v3 Enterprise
  RECAPTCHA_V3_ENTERPRISE: 'ReCaptchaV3EnterpriseTask',
  RECAPTCHA_V3_ENTERPRISE_PROXYLESS: 'ReCaptchaV3EnterpriseTaskProxyLess',
} as const;

export type TaskTypeValue = typeof TaskType[keyof typeof TaskType];

/**
 * Base task configuration
 */
export interface BaseTask {
  type: TaskTypeValue;
  [key: string]: any;
}

/**
 * Proxy configuration for tasks
 */
export interface ProxyConfig {
  proxyType: 'http' | 'https' | 'socks4' | 'socks5';
  proxyAddress: string;
  proxyPort: number;
  proxyLogin?: string;
  proxyPassword?: string;
}

/**
 * Task result from getTaskResult
 */
export interface TaskResult {
  errorId: number;
  errorCode?: string;
  errorDescription?: string;
  status?: 'processing' | 'ready' | 'failed';
  solution?: Record<string, any>;
}

/**
 * Create task request
 */
export interface CreateTaskRequest {
  clientKey: string;
  task: BaseTask;
  developerKey?: string;
}

/**
 * Create task response
 */
export interface CreateTaskResponse {
  errorId: number;
  errorCode?: string;
  errorDescription?: string;
  taskId?: string;
}

/**
 * Get task result request
 */
export interface GetTaskResultRequest {
  clientKey: string;
  taskId: string;
}

/**
 * Get balance request
 */
export interface GetBalanceRequest {
  clientKey: string;
}

/**
 * Get balance response
 */
export interface GetBalanceResponse {
  errorId: number;
  errorCode?: string;
  errorDescription?: string;
  balance?: number;
}

/**
 * Pricing item from GET /pricing
 */
export interface PricingItem {
  task_type: string;
  user_cost: number;
  status: 'active' | 'inactive' | 'soon';
}

/**
 * Pricing response from GET /pricing
 */
export interface PricingResponse {
  pricing: PricingItem[];
}

/**
 * Client configuration options
 */
export interface ClientOptions {
  apiKey?: string;
  baseURL?: string;
  developerKey?: string;
}
