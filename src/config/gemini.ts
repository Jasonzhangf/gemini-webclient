import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GenerateContentConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseModalities?: string[];
  responseMimeType?: string;
}

export interface GeminiConfig {
  apiKey: string;
  modelName: string;
  generateConfig?: GenerateContentConfig;
}

let geminiInstance: GoogleGenerativeAI | null = null;

export const initGemini = (config: GeminiConfig) => {
  geminiInstance = new GoogleGenerativeAI(config.apiKey);
  
  // 设置默认的生成配置
  const defaultGenerateConfig: GenerateContentConfig = {
    responseModalities: ['Text', 'Image']
  };

  // 确保配置对象包含默认的生成配置
  const configWithDefaults = {
    ...config,
    generateConfig: {
      ...defaultGenerateConfig,
      ...config.generateConfig
    }
  };

  localStorage.setItem('geminiConfig', JSON.stringify(configWithDefaults));
};

export const getGeminiInstance = () => {
  if (!geminiInstance) {
    const savedConfig = localStorage.getItem('geminiConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      initGemini(config);
    }
  }
  return geminiInstance;
};

export const getModel = () => {
  const instance = getGeminiInstance();
  if (!instance) {
    throw new Error('Gemini not initialized');
  }
  const savedConfig = localStorage.getItem('geminiConfig');
  if (!savedConfig) {
    throw new Error('Gemini configuration not found');
  }
  const config = JSON.parse(savedConfig);
  
  // 使用配置中的生成配置
  const mergedGenerateConfig = config.generateConfig;

  // 格式化配置信息
  const formattedConfig = {
    modelName: config.modelName,
    generateConfig: mergedGenerateConfig
  };
  console.log('Current Gemini configuration:', JSON.stringify(formattedConfig, null, 2));
  
  return instance.getGenerativeModel({
    model: config.modelName,
    generationConfig: mergedGenerateConfig
  });
};