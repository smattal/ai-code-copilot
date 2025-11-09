import { ModelRouter } from '../src/model/modelRouter';

describe('Model Router', () => {
  let router: ModelRouter;

  beforeEach(() => {
    router = new ModelRouter();
  });

  describe('route', () => {
    it('should return mock model response', async () => {
      const code = '<img src="test.jpg">';
      const response = await router.route(code, 'accessibility');

      expect(response).toBeDefined();
      expect(response.suggestion).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.model).toBe('mock');
    });

    it('should handle different issue types', async () => {
      const accessibilityResponse = await router.route('<img src="test.jpg">', 'accessibility');
      const securityResponse = await router.route('<a href="#" target="_blank">Link</a>', 'security');

      expect(accessibilityResponse.suggestion).toBeDefined();
      expect(securityResponse.suggestion).toBeDefined();
    });

    it('should handle i18n issues', async () => {
      const code = '<button>Click Me</button>';
      const response = await router.route(code, 'i18n');

      expect(response).toBeDefined();
      expect(response.suggestion).toBeDefined();
    });

    it('should handle seo issues', async () => {
      const code = '<html><head></head></html>';
      const response = await router.route(code, 'seo');

      expect(response).toBeDefined();
      expect(response.suggestion).toBeDefined();
    });

    it('should return suggestions with reasoning', async () => {
      const code = '<img src="profile.jpg">';
      const response = await router.route(code, 'accessibility');

      expect(response.reasoning).toBeDefined();
      expect(typeof response.reasoning).toBe('string');
    });

    it('should handle empty code', async () => {
      const response = await router.route('', 'accessibility');

      expect(response).toBeDefined();
      expect(response.suggestion).toBeDefined();
    });

    it('should handle valid code with no issues', async () => {
      const code = '<img src="test.jpg" alt="Test image">';
      const response = await router.route(code, 'accessibility');

      expect(response).toBeDefined();
      expect(response.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('routeBatch', () => {
    it('should process multiple requests', async () => {
      const requests = [
        { code: '<img src="1.jpg">', type: 'accessibility' as const },
        { code: '<img src="2.jpg">', type: 'accessibility' as const },
        { code: '<a target="_blank">Link</a>', type: 'security' as const }
      ];

      const responses = await router.routeBatch(requests);

      expect(responses).toBeDefined();
      expect(Array.isArray(responses)).toBe(true);
      expect(responses.length).toBe(3);
    });

    it('should handle empty batch', async () => {
      const responses = await router.routeBatch([]);

      expect(responses).toBeDefined();
      expect(Array.isArray(responses)).toBe(true);
      expect(responses.length).toBe(0);
    });

    it('should return results in order', async () => {
      const requests = [
        { code: '<img src="1.jpg">', type: 'accessibility' as const },
        { code: '<button>Click</button>', type: 'i18n' as const }
      ];

      const responses = await router.routeBatch(requests);

      expect(responses[0]).toBeDefined();
      expect(responses[1]).toBeDefined();
    });
  });

  describe('getAvailableModels', () => {
    it('should return list of available models', () => {
      const models = router.getAvailableModels();

      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models).toContain('mock');
    });
  });

  describe('getModelInfo', () => {
    it('should return model information', () => {
      const info = router.getModelInfo('mock');

      expect(info).toBeDefined();
      expect(info.name).toBe('mock');
      expect(info.capabilities).toBeDefined();
    });

    it('should handle unknown models', () => {
      const info = router.getModelInfo('unknown-model');

      expect(info).toBeDefined();
    });
  });
});
