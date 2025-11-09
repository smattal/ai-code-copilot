import { logger, LogLevel } from '../src/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.setEnabled(true);
    logger.setLevel(LogLevel.INFO);
  });

  it('should log info messages', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logger.info('Test message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log success messages', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logger.success('Success message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log warning messages', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logger.warning('Warning message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log error messages', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    logger.error('Error message');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should not log when disabled', () => {
    logger.setEnabled(false);
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logger.info('Test message');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should handle JSON output', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logger.json({ test: 'data' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
