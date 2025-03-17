import {
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Container,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { initGemini } from '../config/gemini';

const SettingsPage = () => {
  const toast = useToast();
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('gemini-pro-vision');

  const setConfig = useAppStore((state) => state.setConfig);

  useEffect(() => {
    openGeminiDB().then(db => {
      db.get('config', 'default').then(config => {
        if (config) {
          setApiKey(config.apiKey || '');
          setModelName(config.modelName || 'gemini-pro-vision');
        }
      }).catch(error => {
        console.error('Failed to load config:', error);
      });
    });
  }, []);

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
    <Container maxW="container.md" py={8}>
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Heading size="lg">设置</Heading>
            <Box>
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
                <Button
                  colorScheme="blue"
                  onClick={handleSubmit}
                  isDisabled={!apiKey}
                  width="full"
                >
                  保存配置
                </Button>
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
};

export default SettingsPage;