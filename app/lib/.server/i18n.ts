import enTranslation from '~/locales/en/translation.json';
import zhTranslation from '~/locales/zh/translation.json';

type Language = 'en' | 'zh';

/**
 * Gets server-side translations based on the specified language
 * @param language The language code ('en' or 'zh')
 * @returns Translation object containing server messages
 */
export function getServerTranslations(language: string = 'en') {
  const lang = (language === 'zh' ? 'zh' : 'en') as Language;

  const translations = {
    en: enTranslation,
    zh: zhTranslation,
  };

  return translations[lang];
}

/**
 * Get the progress messages for the specified language
 * @param language The language code ('en' or 'zh')
 */
export function getProgressMessages(language: string = 'en') {
  const translations = getServerTranslations(language);
  const serverMessages = translations.serverMessages || {};
  const progressMessages = serverMessages.progress || {};

  // Ensure all messages are available, with English fallbacks if needed
  const englishProgressMessages = enTranslation.serverMessages?.progress || {};

  // Process template strings for tool functions
  const getToolMessage = (key: 'runningTool' | 'toolExecuted' | 'toolNoResult', toolName: string) => {
    const template = progressMessages[key] || englishProgressMessages[key] || '';
    return template.replace('{{toolName}}', toolName);
  };

  return {
    analysisRequest: progressMessages.analysisRequest || englishProgressMessages.analysisRequest || 'Analysing Request',
    analysisComplete:
      progressMessages.analysisComplete || englishProgressMessages.analysisComplete || 'Analysis Complete',
    determiningFiles:
      progressMessages.determiningFiles || englishProgressMessages.determiningFiles || 'Determining Files to Read',
    filesSelected: progressMessages.filesSelected || englishProgressMessages.filesSelected || 'Code Files Selected',
    runningTool: (toolName: string) => getToolMessage('runningTool', toolName),
    toolExecuted: (toolName: string) => getToolMessage('toolExecuted', toolName),
    toolNoResult: (toolName: string) => getToolMessage('toolNoResult', toolName),
    generatingResponse:
      progressMessages.generatingResponse || englishProgressMessages.generatingResponse || 'Generating Response',
    responseGenerated:
      progressMessages.responseGenerated || englishProgressMessages.responseGenerated || 'Response Generated',
  };
}
