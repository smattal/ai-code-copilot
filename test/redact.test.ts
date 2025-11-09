import { redactSecrets } from '../src/utils/redact';

describe('Redact Utility', () => {
  it('should redact email addresses', () => {
    const text = 'Contact us at test@example.com';
    const result = redactSecrets(text);
    expect(result).toContain('[REDACTED:');
    expect(result).not.toContain('test@example.com');
  });

  it('should redact API keys', () => {
    const text = 'api_key="sk_test_abcd1234efgh5678ijkl9012mnop3456"';
    const result = redactSecrets(text);
    expect(result).toContain('[REDACTED:');
    expect(result).not.toContain('sk_test_abcd1234efgh5678ijkl9012mnop3456');
  });

  it('should redact AWS keys', () => {
    const text = 'AWS key: AKIAIOSFODNN7EXAMPLE';
    const result = redactSecrets(text);
    expect(result).toContain('[REDACTED:');
    expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });

  it('should handle multiple sensitive data types', () => {
    const text = 'Email: user@domain.com, API: api_key=secret123456789012345678901234567890';
    const result = redactSecrets(text);
    expect(result).toContain('[REDACTED:');
  });

  it('should return original text if no sensitive data found', () => {
    const text = 'This is clean text';
    const result = redactSecrets(text);
    expect(result).toBe(text);
  });
});
