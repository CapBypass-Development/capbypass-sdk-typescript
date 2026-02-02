import { CapBypassClient, TaskType } from '@capbypass/sdk';

async function main() {
  const client = new CapBypassClient();

  console.log('Solving reCAPTCHA v3...');

  try {
    const solution = await client.solve({
      type: TaskType.RECAPTCHA_V3_PROXYLESS,
      websiteURL: 'https://example.com',
      websiteKey: '6LcR_okUAAAAAPYrPe-HK_0RULO1aZM15ENyM-Mf',
      pageAction: 'submit',
      minScore: 0.7,
    }, 120);

    console.log('✓ CAPTCHA solved!');
    console.log(`Token: ${solution.gRecaptchaResponse.substring(0, 80)}...`);
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

main();
