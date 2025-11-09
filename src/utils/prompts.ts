import inquirer from 'inquirer';

export interface ContextConfig {
  viewport?: string;
  variant?: string;
  locale?: string;
  targetDevices?: string[];
  colorScheme?: 'light' | 'dark' | 'both';
  a11yLevel?: 'A' | 'AA' | 'AAA';
}

export class InteractivePrompts {
  private static instance: InteractivePrompts;
  private context: ContextConfig = {};

  private constructor() {}

  static getInstance(): InteractivePrompts {
    if (!InteractivePrompts.instance) {
      InteractivePrompts.instance = new InteractivePrompts();
    }
    return InteractivePrompts.instance;
  }

  async promptForViewport(currentValue?: string): Promise<string> {
    if (this.context.viewport) return this.context.viewport;

    const { viewport } = await inquirer.prompt([{
      type: 'list',
      name: 'viewport',
      message: 'Which viewport are you targeting?',
      default: currentValue || 'desktop',
      choices: [
        { name: 'Desktop (1024px+)', value: 'desktop' },
        { name: 'Tablet (768px - 1023px)', value: 'tablet' },
        { name: 'Mobile (320px - 767px)', value: 'mobile' },
        { name: 'Responsive (all sizes)', value: 'responsive' }
      ]
    }]);

    this.context.viewport = viewport;
    return viewport;
  }

  async promptForVariant(componentName: string, variants: string[]): Promise<string> {
    if (this.context.variant) return this.context.variant;

    const { variant } = await inquirer.prompt([{
      type: 'list',
      name: 'variant',
      message: `Which variant of ${componentName} are you targeting?`,
      choices: variants.map(v => ({ name: v, value: v }))
    }]);

    this.context.variant = variant;
    return variant;
  }

  async promptForLocale(currentValue?: string): Promise<string> {
    if (this.context.locale) return this.context.locale;

    const { locale } = await inquirer.prompt([{
      type: 'list',
      name: 'locale',
      message: 'What is the target locale?',
      default: currentValue || 'en-US',
      choices: [
        { name: 'English (US)', value: 'en-US' },
        { name: 'English (UK)', value: 'en-GB' },
        { name: 'Spanish', value: 'es' },
        { name: 'French', value: 'fr' },
        { name: 'German', value: 'de' },
        { name: 'Japanese', value: 'ja' },
        { name: 'Chinese (Simplified)', value: 'zh-CN' },
        { name: 'Other (specify)', value: 'other' }
      ]
    }]);

    if (locale === 'other') {
      const { customLocale } = await inquirer.prompt([{
        type: 'input',
        name: 'customLocale',
        message: 'Enter the locale code (e.g., pt-BR):',
        validate: (input: string) => 
          /^[a-z]{2}(-[A-Z]{2})?$/.test(input) || 'Please enter a valid locale code'
      }]);
      this.context.locale = customLocale;
      return customLocale;
    }

    this.context.locale = locale;
    return locale;
  }

  async promptForTargetDevices(): Promise<string[]> {
    if (this.context.targetDevices) return this.context.targetDevices;

    const { devices } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'devices',
      message: 'Which devices should this support?',
      choices: [
        { name: 'Desktop browsers', value: 'desktop', checked: true },
        { name: 'Mobile browsers', value: 'mobile', checked: true },
        { name: 'Tablets', value: 'tablet', checked: true },
        { name: 'Screen readers', value: 'screenreader', checked: true },
        { name: 'Smart TVs', value: 'tv' },
        { name: 'Game consoles', value: 'gaming' }
      ]
    }]);

    this.context.targetDevices = devices;
    return devices;
  }

  async promptForColorScheme(): Promise<'light' | 'dark' | 'both'> {
    if (this.context.colorScheme) return this.context.colorScheme;

    const { scheme } = await inquirer.prompt([{
      type: 'list',
      name: 'scheme',
      message: 'Which color scheme should be supported?',
      choices: [
        { name: 'Light mode only', value: 'light' },
        { name: 'Dark mode only', value: 'dark' },
        { name: 'Both light and dark modes', value: 'both' }
      ]
    }]);

    this.context.colorScheme = scheme;
    return scheme;
  }

  async promptForA11yLevel(): Promise<'A' | 'AA' | 'AAA'> {
    if (this.context.a11yLevel) return this.context.a11yLevel;

    const { level } = await inquirer.prompt([{
      type: 'list',
      name: 'level',
      message: 'What accessibility conformance level are you targeting?',
      choices: [
        { name: 'Level A (minimum)', value: 'A' },
        { name: 'Level AA (recommended)', value: 'AA' },
        { name: 'Level AAA (enhanced)', value: 'AAA' }
      ]
    }]);

    this.context.a11yLevel = level;
    return level;
  }

  async gatherRequiredContext(requirements: string[]): Promise<ContextConfig> {
    const context: ContextConfig = {};

    for (const req of requirements) {
      switch (req) {
        case 'viewport':
          context.viewport = await this.promptForViewport();
          break;
        case 'locale':
          context.locale = await this.promptForLocale();
          break;
        case 'devices':
          context.targetDevices = await this.promptForTargetDevices();
          break;
        case 'colorScheme':
          context.colorScheme = await this.promptForColorScheme();
          break;
        case 'a11yLevel':
          context.a11yLevel = await this.promptForA11yLevel();
          break;
      }
    }

    return context;
  }

  clearContext() {
    this.context = {};
  }
}