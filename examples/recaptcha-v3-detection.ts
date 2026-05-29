/**
 * reCAPTCHA v3 Detection Example (TypeScript)
 *
 * Demonstrates how to programmatically detect whether a site uses
 * reCAPTCHA v3 Standard or Enterprise, and automatically select
 * the correct task type.
 *
 * Requirements:
 * - npm install @capbypass/sdk puppeteer
 */

import { CapBypassClient, TaskType } from '@capbypass/sdk';
import puppeteer from 'puppeteer';

// Initialize client
const client = new CapBypassClient({
  apiKey: process.env.CAPBYPASS_API_KEY || '',
});

/**
 * Detect reCAPTCHA type using Puppeteer network interception
 *
 * This is the most reliable method as it captures the actual script
 * loading, regardless of when it loads in the page lifecycle.
 */
async function detectRecaptchaType(url: string): Promise<'standard' | 'enterprise' | null> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  let detectedType: 'standard' | 'enterprise' | null = null;

  // Intercept network requests
  page.on('request', (request) => {
    const requestUrl = request.url();

    // Check for reCAPTCHA script loading
    if (requestUrl.includes('/recaptcha/enterprise.js')) {
      detectedType = 'enterprise';
      console.log('✓ Detected: reCAPTCHA v3 ENTERPRISE');
    } else if (requestUrl.includes('/recaptcha/api.js')) {
      detectedType = 'standard';
      console.log('✓ Detected: reCAPTCHA v3 STANDARD');
    }
  });

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Fallback: Check DOM if no network request detected
    if (!detectedType) {
      console.log('No network detection, checking DOM...');
      detectedType = await page.evaluate(() => {
        if ((window as any).grecaptcha?.enterprise) return 'enterprise';
        if ((window as any).grecaptcha) return 'standard';
        return null;
      });
    }
  } catch (error) {
    console.error(`Detection failed: ${(error as Error).message}`);
  } finally {
    await browser.close();
  }

  return detectedType;
}

/**
 * Solve reCAPTCHA with automatic type detection
 */
async function solveWithAutoDetection(
  url: string,
  siteKey: string,
  action: string
): Promise<string> {
  console.log(`\nDetecting reCAPTCHA type for: ${url}`);

  const detectedType = await detectRecaptchaType(url);

  if (!detectedType) {
    throw new Error(
      'Could not detect reCAPTCHA type. Please verify the site uses reCAPTCHA v3.'
    );
  }

  const taskType = detectedType === 'enterprise'
    ? TaskType.RECAPTCHA_V3_ENTERPRISE_PROXYLESS
    : TaskType.RECAPTCHA_V3_PROXYLESS;

  console.log(`Using task type: ${taskType}\n`);

  const solution = await client.solve({
    type: taskType,
    websiteURL: url,
    websiteKey: siteKey,
    pageAction: action,
  });

  return solution.gRecaptchaResponse;
}

/**
 * Example with caching (recommended for production)
 */
class RecaptchaTypeCache {
  private cache = new Map<string, 'standard' | 'enterprise'>();

  async getType(url: string): Promise<'standard' | 'enterprise'> {
    const domain = new URL(url).hostname;

    if (!this.cache.has(domain)) {
      console.log(`Cache miss for ${domain}, detecting...`);
      const type = await detectRecaptchaType(url);

      if (!type) {
        throw new Error(`Could not detect reCAPTCHA type for ${domain}`);
      }

      this.cache.set(domain, type);
      console.log(`Cached ${domain} → ${type}`);
    } else {
      console.log(`Cache hit for ${domain} → ${this.cache.get(domain)}`);
    }

    return this.cache.get(domain)!;
  }

  clear(domain?: string) {
    if (domain) {
      this.cache.delete(new URL(domain).hostname);
    } else {
      this.cache.clear();
    }
  }
}

// ── Usage Examples ───────────────────────────────────────────────────────

async function example1_BasicDetection() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Example 1: Basic Detection');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const token = await solveWithAutoDetection(
      'https://example.com',
      '6Lc...',
      'submit'
    );

    console.log(`✓ Token generated: ${token.substring(0, 50)}...\n`);
  } catch (error) {
    console.error(`✗ Failed: ${(error as Error).message}\n`);
  }
}

async function example2_WithCaching() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Example 2: Detection with Caching');
  console.log('═══════════════════════════════════════════════════════\n');

  const cache = new RecaptchaTypeCache();

  try {
    // First solve - detects and caches
    const type1 = await cache.getType('https://example.com');
    const solution1 = await client.solve({
      type: type1 === 'enterprise'
        ? TaskType.RECAPTCHA_V3_ENTERPRISE_PROXYLESS
        : TaskType.RECAPTCHA_V3_PROXYLESS,
      websiteURL: 'https://example.com',
      websiteKey: '6Lc...',
      pageAction: 'submit',
    });

    console.log(`✓ First solve: ${solution1.gRecaptchaResponse.substring(0, 50)}...\n`);

    // Second solve - uses cache (faster!)
    const type2 = await cache.getType('https://example.com');
    const solution2 = await client.solve({
      type: type2 === 'enterprise'
        ? TaskType.RECAPTCHA_V3_ENTERPRISE_PROXYLESS
        : TaskType.RECAPTCHA_V3_PROXYLESS,
      websiteURL: 'https://example.com',
      websiteKey: '6Lc...',
      pageAction: 'checkout',
    });

    console.log(`✓ Second solve (cached): ${solution2.gRecaptchaResponse.substring(0, 50)}...\n`);
  } catch (error) {
    console.error(`✗ Failed: ${(error as Error).message}\n`);
  }
}

async function example3_MultiSite() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Example 3: Multiple Sites');
  console.log('═══════════════════════════════════════════════════════\n');

  const sites = [
    { url: 'https://site1.com', siteKey: '6Lc...', action: 'login' },
    { url: 'https://site2.com', siteKey: '6Ld...', action: 'submit' },
    { url: 'https://site3.com', siteKey: '6Le...', action: 'checkout' },
  ];

  for (const site of sites) {
    try {
      console.log(`\nProcessing: ${site.url}`);
      const token = await solveWithAutoDetection(site.url, site.siteKey, site.action);
      console.log(`  ✓ Success: ${token.substring(0, 50)}...`);
    } catch (error) {
      console.error(`  ✗ Failed: ${(error as Error).message}`);
    }
  }

  console.log();
}

// Run examples
(async () => {
  if (!process.env.CAPBYPASS_API_KEY) {
    console.error('ERROR: CAPBYPASS_API_KEY environment variable not set');
    process.exit(1);
  }

  await example1_BasicDetection();
  await example2_WithCaching();
  await example3_MultiSite();
})();
