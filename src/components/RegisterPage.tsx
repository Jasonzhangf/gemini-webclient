import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Center,
  Heading,
  Text,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { openGeminiDB } from '../utils/db';

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: '注册失败',
        description: '两次输入的密码不一致',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const db = await openGeminiDB();
    
    try {
      const existingUser = await db.get('users', formData.username);
      if (existingUser) {
        toast({
          title: '注册失败',
          description: '用户名已存在',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      await db.put('users', {
        username: formData.username,
        password: formData.password,
        createdAt: Date.now(),
      });

      toast({
        title: '注册成功',
        description: '请前往登录页面登录',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      // 清空表单
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: '注册失败',
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
          <Heading size="lg">注册</Heading>
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
              <FormControl isRequired>
                <FormLabel>确认密码</FormLabel>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" w="100%">
                注册
              </Button>
              <Text>
                已有账号？
                <ChakraLink as={Link} to="/login" color="blue.500">
                  前往登录
                </ChakraLink>
              </Text>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Center>
  );
}