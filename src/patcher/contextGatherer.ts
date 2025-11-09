import { InteractivePrompts, ContextConfig } from '../utils/prompts';

/**
 * Gathers user context based on file content and type
 */
export class ContextGatherer {
  private prompts: InteractivePrompts;

  constructor() {
    this.prompts = InteractivePrompts.getInstance();
  }

  /**
   * Gather context for HTML/JSX/TSX files
   */
  async gatherHtmlContext(content: string): Promise<ContextConfig> {
    const context: ContextConfig = {};

    if (this.hasViewportSensitiveContent(content)) {
      context.viewport = await this.prompts.promptForViewport();
    }

    if (this.hasLocalizationNeeds(content)) {
      context.locale = await this.prompts.promptForLocale();
    }

    if (this.hasColorSchemeContent(content)) {
      context.colorScheme = await this.prompts.promptForColorScheme();
    }

    if (this.hasAccessibilityContent(content)) {
      context.a11yLevel = await this.prompts.promptForA11yLevel();
    }

    return context;
  }

  /**
   * Gather context for CSS files
   */
  async gatherCssContext(): Promise<ContextConfig> {
    const context: ContextConfig = {};
    context.viewport = await this.prompts.promptForViewport();
    context.colorScheme = await this.prompts.promptForColorScheme();
    await this.prompts.promptForTargetDevices();
    return context;
  }

  private hasViewportSensitiveContent(content: string): boolean {
    return /<meta\s+name=["']viewport["']/.test(content) || /media=/i.test(content);
  }

  private hasLocalizationNeeds(content: string): boolean {
    return /<html\b/.test(content) || /lang=/.test(content);
  }

  private hasColorSchemeContent(content: string): boolean {
    return /color|background|theme/i.test(content);
  }

  private hasAccessibilityContent(content: string): boolean {
    return /<img|aria-|role=/.test(content);
  }
}
