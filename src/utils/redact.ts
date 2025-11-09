import { createHash } from 'crypto';

// Patterns to detect sensitive information
const PATTERNS = {
  // API Keys and tokens
  API_KEY: /(?:api[_-]?key|apikey|auth[_-]?token|access[_-]?token)['\"]?\s*[:=]\s*['"]?([a-zA-Z0-9._\-]{32,})['"]?/gi,
  
  // AWS keys
  AWS_KEY: /AKIA[0-9A-Z]{16}/g,
  
  // Private keys
  PRIVATE_KEY: /-----BEGIN (?:RSA )?PRIVATE KEY-----[^]*?-----END (?:RSA )?PRIVATE KEY-----/gm,
  
  // Email addresses
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Phone numbers
  PHONE: /(?:\+\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/g,
  
  // Social Security Numbers
  SSN: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  
  // Credit Card Numbers
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  
  // IP Addresses
  IP_ADDRESS: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  
  // URLs with credentials
  URL_WITH_CREDS: /[a-zA-Z]+:\/\/[^\/\s:@]*?:[^\/\s:@]*?@[^\/\s:@]+/g
};

/**
 * Creates a deterministic hash of a string
 */
function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex').substring(0, 8);
}

/**
 * Redacts sensitive information from text content
 */
export function redactSecrets(content: string): string {
  let redactedContent = content;
  
  // Apply each pattern
  for (const [type, pattern] of Object.entries(PATTERNS)) {
    redactedContent = redactedContent.replace(pattern, (match) => {
      const hash = hashValue(match);
      return `[REDACTED:${type}:${hash}]`;
    });
  }
  
  return redactedContent;
}

/**
 * Redacts sensitive information from an object by traversing it
 */
export function redactSecretsInObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return redactSecrets(obj) as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactSecretsInObject(item)) as T;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = redactSecretsInObject(value);
    }
    return result as T;
  }
  
  return obj;
}
