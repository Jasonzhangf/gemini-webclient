import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Center,
  Heading,
} from '@chakra-ui/react';
import { useAppStore } from '../store';
import fs from 'fs';
import path from 'path';

interface LoginFormData {
  username: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    rememberMe: false,
  });
  const toast = useToast();
  const setUser = useAppStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const configPath = path.join(process.cwd(), 'config.ini');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const configLines = configContent.split('\n');
      const configData: { [key: string]: string } = {};
      
      configLines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          configData[key.trim()] = value.trim();
        }
      });

      if (formData.username === configData.USER1 && formData.password === configData.PASSWORD1) {
        setUser({
          username: formData.username,
          isLoggedIn: true,
          rememberMe: formData.rememberMe,
        });

        if (formData.rememberMe) {
          localStorage.setItem('userAuth', JSON.stringify({
            username: formData.username,
            isLoggedIn: true,
          }));
        }

      toast({
        title: '登录成功',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } else {
      toast({
        title: '登录失败',
        description: '用户名或密码错误',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: '登录失败',
        description: '发生错误，请稍后重试',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Center h="100vh">
      <Box w="100%" maxW="400px" p={8} borderWidth={1} borderRadius="lg">
        <VStack spacing={6}>
          <Heading size="lg">登录</Heading>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>用户名</FormLabel>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>密码</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </FormControl>
              <Checkbox
                isChecked={formData.rememberMe}
                onChange={(e) =>
                  setFormData({ ...formData, rememberMe: e.target.checked })
                }
              >
                记住我
              </Checkbox>
              <Button type="submit" colorScheme="blue" width="full">
                登录
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Center>
  );
}