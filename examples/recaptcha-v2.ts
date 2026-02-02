import { CapBypassClient, TaskType } from '@capbypass/sdk';

async function main() {
  const client = new CapBypassClient();

  console.log('Solving reCAPTCHA v2...');

  try {
    const solution = await client.solve({
      type: TaskType.RECAPTCHA_V2_PROXYLESS,
      websiteURL: 'https://www.google.com/recaptcha/api2/demo',
      websiteKey: '6Le-wvkSAAAAAPBMRTvw0Q4Muexq9bi0DJwx_mJ-',
    }, 120);

    console.log('✓ CAPTCHA solved!');
    console.log(`Token: ${solution.gRecaptchaResponse.substring(0, 80)}...`);
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

main();
