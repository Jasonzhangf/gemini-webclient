import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { initGemini } from '../config/gemini';

const ConfigModal = () => {
  const toast = useToast();
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-pro-vision');

  useEffect(() => {
    const savedConfig = localStorage.getItem('geminiConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setApiKey(config.apiKey || '');
      setModelName(config.modelName || 'gemini-2.0-flash-exp-image-generation');
      // 自动初始化配置
      try {
        initGemini(config);
        setConfig(config);
      } catch (error) {
        console.error('Failed to initialize config:', error);
      }
    }
  }, []);
  const setConfig = useAppStore((state) => state.setConfig);
  const setShowConfig = useAppStore((state) => state.setShowConfig);
  const showConfig = useAppStore((state) => state.showConfig);

  const handleSubmit = () => {
    const config = {
      apiKey,
      modelName,
      generateConfig: {
        responseModalities: ['Text', 'Image']
      }
    };
    try {
      initGemini(config);
      setConfig(config);
      setShowConfig(false);
      toast({
        title: '配置保存成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: '配置保存失败',
        description: error instanceof Error ? error.message : '未知错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={showConfig} onClose={() => setShowConfig(false)} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>配置 Gemini API</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>API Key</FormLabel>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入你的 Gemini API Key"
              />
            </FormControl>
            <FormControl>
              <FormLabel>模型名称</FormLabel>
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="默认: gemini-pro-vision"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSubmit} isDisabled={!apiKey}>
            保存配置
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfigModal;