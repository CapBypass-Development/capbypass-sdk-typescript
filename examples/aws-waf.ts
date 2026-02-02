import { CapBypassClient, TaskType } from '@capbypass/sdk';

async function main() {
  const client = new CapBypassClient();

  console.log('Solving AWS WAF challenge...');

  try {
    const solution = await client.solve({
      type: TaskType.ANTI_AWS_WAF_PROXYLESS,
      websiteURL: 'https://login.tomorrowland.com',
      awsChallengeJS: 'https://b516434d791a.aa24f28d.eu-west-1.token.awswaf.com/b516434d791a/challenge.js',
    }, 120);

    console.log('✓ AWS WAF challenge solved!');
    console.log(`Cookie: ${solution.cookie}`);
  } catch (error) {
    console.error('✗ Error:', error);
  }
}

main();
