import 'dotenv/config';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { Client } from 'pg';

const requiredEnvKeys = [
  'DATABASE_URL',
  'AWS_ENDPOINT_URL_S3',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_BUSINESS_ACCOUNT_ID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

const env = process.env;

function redact(value) {
  if (!value) return 'not set';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function envStatus() {
  const missing = requiredEnvKeys.filter((key) => !env[key] || String(env[key]).trim() === '');
  return {
    missing,
    summary: `${requiredEnvKeys.length - missing.length}/${requiredEnvKeys.length} env values configured`,
  };
}

async function testDatabase() {
  const connectionString = env.DATABASE_URL;

  if (!connectionString) {
    return { name: 'Database', ok: false, message: 'DATABASE_URL is missing.' };
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query('SELECT 1 AS ok');
    const row = result.rows?.[0];

    return {
      name: 'Database',
      ok: row?.ok === 1,
      message: row?.ok === 1 ? 'PostgreSQL connection succeeded and SELECT 1 returned successfully.' : 'PostgreSQL responded unexpectedly.',
    };
  } catch (error) {
    return {
      name: 'Database',
      ok: false,
      message: `PostgreSQL connection failed: ${error.message}`,
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function testS3() {
  const endpoint = env.AWS_ENDPOINT_URL_S3;
  const bucket = env.AWS_BUCKET_NAME;
  const accessKeyId = env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
  const region = env.AWS_REGION || 'us-east-1';

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return { name: 'S3', ok: false, message: 'One or more AWS S3 values are missing.' };
  }

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    const response = await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return {
      name: 'S3',
      ok: response.$metadata?.httpStatusCode >= 200 && response.$metadata?.httpStatusCode < 300,
      message: response.$metadata?.httpStatusCode
        ? `S3 bucket check succeeded with HTTP ${response.$metadata.httpStatusCode}.`
        : 'S3 bucket check responded successfully.',
    };
  } catch (error) {
    return {
      name: 'S3',
      ok: false,
      message: `S3 bucket check failed: ${error.name}: ${error.message}`,
    };
  }
}

async function testWhatsApp() {
  const token = env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  const checks = [];

  if (!token) {
    checks.push({ name: 'WhatsApp', ok: false, message: 'WHATSAPP_ACCESS_TOKEN is missing.' });
    return checks;
  }

  if (phoneNumberId) {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}?fields=id,name&access_token=${encodeURIComponent(token)}`,
      { method: 'GET' },
    );
    const body = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = { raw: body };
    }

    if (response.ok && parsed?.id) {
      checks.push({ name: 'WhatsApp phone number', ok: true, message: 'WhatsApp phone number metadata was reachable and returned an ID.' });
    } else {
      checks.push({
        name: 'WhatsApp phone number',
        ok: false,
        message: `WhatsApp phone number check failed: ${response.status} ${response.statusText}${parsed?.error ? ` - ${parsed.error.message}` : ''}`,
      });
    }
  } else {
    checks.push({ name: 'WhatsApp phone number', ok: false, message: 'WHATSAPP_PHONE_NUMBER_ID is missing.' });
  }

  if (businessAccountId) {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(businessAccountId)}?fields=id,name&access_token=${encodeURIComponent(token)}`,
      { method: 'GET' },
    );
    const body = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = { raw: body };
    }

    if (response.ok && parsed?.id) {
      checks.push({ name: 'WhatsApp business account', ok: true, message: 'WhatsApp business account metadata was reachable and returned an ID.' });
    } else {
      checks.push({
        name: 'WhatsApp business account',
        ok: false,
        message: `WhatsApp business account check failed: ${response.status} ${response.statusText}${parsed?.error ? ` - ${parsed.error.message}` : ''}`,
      });
    }
  } else {
    checks.push({ name: 'WhatsApp business account', ok: false, message: 'WHATSAPP_BUSINESS_ACCOUNT_ID is missing.' });
  }

  return checks;
}

async function testUpstashRedis() {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return { name: 'Upstash Redis', ok: false, message: 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing.' };
  }

  const baseUrl = url.replace(/\/+$/, '');

  try {
    const response = await fetch(`${baseUrl}/ping`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const text = await response.text();

    if (response.ok && /pong/i.test(text)) {
      return {
        name: 'Upstash Redis',
        ok: true,
        message: 'Upstash Redis responded successfully to the ping endpoint.',
      };
    }

    return {
      name: 'Upstash Redis',
      ok: false,
      message: `Upstash Redis ping failed: ${response.status} ${response.statusText}${text ? ` - ${text}` : ''}`,
    };
  } catch (error) {
    return {
      name: 'Upstash Redis',
      ok: false,
      message: `Upstash Redis request failed: ${error.message}`,
    };
  }
}

async function main() {
  const status = envStatus();
  console.log('=== Environment connection check ===');
  console.log(status.summary);

  if (status.missing.length > 0) {
    console.log('Missing env values:', status.missing.join(', '));
  }

  console.log('');
  console.log('Credentials in use:');
  console.log(`- DATABASE_URL: ${redact(env.DATABASE_URL)}`);
  console.log(`- AWS_ACCESS_KEY_ID: ${redact(env.AWS_ACCESS_KEY_ID)}`);
  console.log(`- AWS_SECRET_ACCESS_KEY: ${redact(env.AWS_SECRET_ACCESS_KEY)}`);
  console.log(`- AWS_ENDPOINT_URL_S3: ${redact(env.AWS_ENDPOINT_URL_S3)}`);
  console.log(`- AWS_BUCKET_NAME: ${env.AWS_BUCKET_NAME || 'not set'}`);
  console.log(`- WHATSAPP_ACCESS_TOKEN: ${redact(env.WHATSAPP_ACCESS_TOKEN)}`);
  console.log(`- WHATSAPP_PHONE_NUMBER_ID: ${env.WHATSAPP_PHONE_NUMBER_ID || 'not set'}`);
  console.log(`- WHATSAPP_BUSINESS_ACCOUNT_ID: ${env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'not set'}`);
  console.log(`- UPSTASH_REDIS_REST_URL: ${redact(env.UPSTASH_REDIS_REST_URL)}`);
  console.log(`- UPSTASH_REDIS_REST_TOKEN: ${redact(env.UPSTASH_REDIS_REST_TOKEN)}`);
  console.log('');

  const results = [
    await testDatabase(),
    await testS3(),
    ...(await testWhatsApp()),
    await testUpstashRedis(),
  ];

  console.log('=== Results ===');
  let passed = 0;
  let failed = 0;

  for (const test of results) {
    const label = test.ok ? 'PASS' : 'FAIL';
    console.log(`${label} | ${test.name}: ${test.message}`);
    if (test.ok) passed += 1;
    else failed += 1;
  }

  console.log('');
  console.log(`Summary: ${passed} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Fatal error while running environment checks:', error);
  process.exit(1);
});
