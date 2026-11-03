import { CapBypassClient, TaskType } from '@capbypass/sdk';

async function main() {
  const client = new CapBypassClient();

  console.log('Solving Cloudflare Turnstile...');

  try {
    const solution = await client.solve({
      type: TaskType.TURNSTILE_PROXYLESS,
      websiteURL: 'https://example.com/login',
      websiteKey: '0x4AAAAAAAxxxxxxxxxxxxxx',
      action: 'login', // optional
      cData: 'session-42', // optional
    }, 120);

    console.log('✓ CAPTCHA solved!');
    console.log(`Token: ${solution.token.substring(0, 50)}...`);
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

main();
