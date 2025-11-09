import { redactSecrets, redactSecretsInObject } from '../src/utils/redact';

describe('Redact Utility', () => {
  describe('redactSecrets', () => {
    it('should redact email addresses', () => {
      const text = 'Contact us at support@example.com and info@company.org';
      const result = redactSecrets(text);

      expect(result).toContain('[REDACTED:');
      expect(result).not.toContain('support@example.com');
      expect(result).not.toContain('info@company.org');
    });

    it('should redact API keys', () => {
      const text = 'API_KEY=sk_test_1234567890abcdefghijklmnopqrstuvwxyz';
      const result = redactSecrets(text);

      expect(result).toContain('[REDACTED:');
      expect(result).not.toContain('sk_test_1234567890abcdefghijklmnopqrstuvwxyz');
    });

    it('should redact AWS keys', () => {
      const text = 'AWS Access Key: AKIAIOSFODNN7EXAMPLE';
      const result = redactSecrets(text);

      expect(result).toContain('[REDACTED:');
      expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });

    it('should redact private keys', () => {
      const text = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAK\n-----END RSA PRIVATE KEY-----';
      const result = redactSecrets(text);

      expect(result).toContain('[REDACTED:');
      expect(result).not.toContain('BEGIN RSA PRIVATE KEY');
    });

    it('should handle multiple secret types in one string', () => {
      const text = 'Email: user@domain.com, API: api_key=secret123456789012345678901234567890, AWS: AKIAIOSFODNN7EXAMPLE';
      const result = redactSecrets(text);

      expect(result).toContain('[REDACTED:');
      const redactCount = (result.match(/\[REDACTED:/g) || []).length;
      expect(redactCount).toBeGreaterThan(1);
    });

    it('should return original text if no secrets found', () => {
      const text = 'This is clean text with no secrets';
      const result = redactSecrets(text);

      expect(result).toBe(text);
    });

    it('should handle empty strings', () => {
      const result = redactSecrets('');

      expect(result).toBe('');
    });

    it('should use consistent hashes for same secrets', () => {
      const text1 = 'Email: test@example.com';
      const text2 = 'Contact: test@example.com';
      
      const result1 = redactSecrets(text1);
      const result2 = redactSecrets(text2);

      // Extract the hash from results
      const hash1 = result1.match(/\[REDACTED:[^:]+:([^\]]+)\]/)?.[1];
      const hash2 = result2.match(/\[REDACTED:[^:]+:([^\]]+)\]/)?.[1];

      expect(hash1).toBe(hash2);
    });
  });

  describe('redactSecretsInObject', () => {
    it('should redact secrets in object properties', () => {
      const obj = {
        email: 'admin@example.com',
        apiKey: 'sk_test_1234567890abcdefghijklmnopqrstuvwxyz',
        publicInfo: 'This is public'
      };

      const result = redactSecretsInObject(obj);

      expect(result.email).toContain('[REDACTED:');
      expect(result.apiKey).toContain('[REDACTED:');
      expect(result.publicInfo).toBe('This is public');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          contact: {
            email: 'john@example.com'
          }
        }
      };

      const result = redactSecretsInObject(obj);

      expect(result.user.contact.email).toContain('[REDACTED:');
      expect(result.user.name).toBe('John');
    });

    it('should handle arrays', () => {
      const obj = {
        emails: ['user1@example.com', 'user2@example.com']
      };

      const result = redactSecretsInObject(obj);

      expect(Array.isArray(result.emails)).toBe(true);
      expect(result.emails[0]).toContain('[REDACTED:');
      expect(result.emails[1]).toContain('[REDACTED:');
    });

    it('should handle arrays of objects', () => {
      const obj = {
        users: [
          { name: 'User1', email: 'user1@example.com' },
          { name: 'User2', email: 'user2@example.com' }
        ]
      };

      const result = redactSecretsInObject(obj);

      expect(result.users[0].email).toContain('[REDACTED:');
      expect(result.users[1].email).toContain('[REDACTED:');
      expect(result.users[0].name).toBe('User1');
    });

    it('should handle null values', () => {
      const obj = {
        email: null,
        name: 'Test'
      };

      const result = redactSecretsInObject(obj);

      expect(result.email).toBeNull();
      expect(result.name).toBe('Test');
    });

    it('should handle undefined values', () => {
      const obj = {
        email: undefined,
        name: 'Test'
      };

      const result = redactSecretsInObject(obj);

      expect(result.email).toBeUndefined();
      expect(result.name).toBe('Test');
    });

    it('should handle primitive types', () => {
      expect(redactSecretsInObject('test@example.com')).toContain('[REDACTED:');
      expect(redactSecretsInObject(123)).toBe(123);
      expect(redactSecretsInObject(true)).toBe(true);
    });

    it('should handle empty objects', () => {
      const result = redactSecretsInObject({});

      expect(result).toEqual({});
    });
  });
});
