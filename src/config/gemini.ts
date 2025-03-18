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
    temperature: 0.7,
    topP: 1.0,
    topK: 40,
    maxOutputTokens: 2048,
    responseModalities: ['text', 'image'],
    responseMimeType: 'text/plain'
  };

  // 确保配置对象包含默认的生成配置
  const configWithDefaults = {
    apiKey: config.apiKey,
    modelName: config.modelName,
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
    throw new Error('Gemini 未初始化，请先配置API密钥');
  }
  const savedConfig = localStorage.getItem('geminiConfig');
  if (!savedConfig) {
    throw new Error('未找到Gemini配置信息，请先完成配置');
  }
  const config = JSON.parse(savedConfig);
  
  // 使用配置中的生成配置
  const mergedGenerateConfig = config.generateConfig;

  // 格式化配置信息
  const formattedConfig = {
    modelName: config.modelName,
    generateConfig: mergedGenerateConfig
  };
  console.log('当前Gemini配置:', JSON.stringify(formattedConfig, null, 2));
  
  try {
    return instance.getGenerativeModel({
      model: formattedConfig.modelName,
      generationConfig: mergedGenerateConfig
    });
  } catch (error) {
    if (error.message?.includes('404')) {
      throw new Error(`模型 ${formattedConfig.modelName} 不可用，请检查模型名称是否正确`);
    }
    throw error;
  }
};