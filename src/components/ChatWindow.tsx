import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Image,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { AttachmentIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { getModel } from '../config/gemini';
import { ChatMessage } from '../utils/db';

const ChatWindow = () => {
  const toast = useToast();
  const { currentSession, addMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imagePromises = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((imageUrls) => {
      setImages((prev) => [...prev, ...imageUrls]);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!input.trim() && images.length === 0) return;
    if (!currentSession) {
      toast({
        title: '请先创建会话',
        status: 'warning',
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const model = getModel();
      // 显示当前使用的模型配置
      toast({
        title: '当前模型配置',
        description: '正在使用的模型配置已打印到控制台',
        status: 'info',
        duration: 2000,
      });
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: Date.now(),
        images: images,
      };
      addMessage(userMessage);

      const imagesParts = await Promise.all(
        images.map(async (imageUrl) => {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          return {
            inlineData: {
              data: imageUrl.split(',')[1],
              mimeType: blob.type,
            },
          };
        })
      );

      const result = await model.generateContent([input, ...imagesParts]);
      const response = await result.response;
      
      if (!response.text) {
        throw new Error('未收到AI的回复');
      }

      const modelMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        content: response.text(),
        timestamp: Date.now(),
        images: response.candidates?.[0]?.content?.parts
          ?.filter(part => part.inlineData?.mimeType?.startsWith('image/'))          ?.map(part => `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}`) || [],
      };
      await new Promise(resolve => setTimeout(resolve, 100)); // 确保UI更新完成
      addMessage(modelMessage);

      setInput('');
      setImages([]);
    } catch (error) {
      let errorMessage = '未知错误';
      if (error instanceof Error) {
        errorMessage = error.message;
        // 针对模型弃用的特殊错误处理
        if (errorMessage.includes('has been deprecated')) {
          errorMessage = '当前模型已被弃用，请在设置中更换为其他可用模型（如 gemini-1.5-flash）';
        }
      }
      toast({
        title: '发送失败',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box h="full" display="flex" flexDirection="column">
      <Box flex={1} overflowY="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {currentSession?.messages.map((message) => (
            <Box
              key={message.id}
              bg={message.role === 'user' ? 'blue.50' : 'gray.50'}
              p={3}
              borderRadius="md"
              alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
              maxW="70%"
            >
              {message.images?.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  maxH="200px"
                  mb={2}
                  borderRadius="md"
                  onDoubleClick={() => setImages(prev => [...prev, image])}
                  cursor="pointer"
                  title="双击添加到发送区域"
                />
              ))}
              <Text onDoubleClick={() => setInput(message.content)}>{message.content}</Text>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      <Box p={4} borderTop="1px" borderColor="gray.200">
        {images.length > 0 && (
          <HStack spacing={2} mb={4} overflowX="auto" p={2}>
            {images.map((image, index) => (
              <Box key={index} position="relative">
                <Image src={image} h="100px" borderRadius="md" />
                <IconButton
                  aria-label="删除图片"
                  icon={<DeleteIcon />}
                  size="xs"
                  position="absolute"
                  top={1}
                  right={1}
                  onClick={() => removeImage(index)}
                />
              </Box>
            ))}
          </HStack>
        )}
        <HStack>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <input
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <IconButton
            aria-label="上传图片"
            icon={<AttachmentIcon />}
            onClick={() => fileInputRef.current?.click()}
          />
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            发送
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default ChatWindow;