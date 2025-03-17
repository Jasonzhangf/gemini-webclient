import { Center, Text } from '@chakra-ui/react';
import { Component, ReactNode } from 'react';
import { useAppStore } from '../store';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary caught an error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    const { addLog } = useAppStore.getState();
    addLog('error', 'React Error Boundary caught an error', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center h="100vh" flexDirection="column" gap={4}>
          <Text fontSize="xl">应用加载出错，请刷新页面重试</Text>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Text fontSize="sm" color="red.500" maxW="600px" whiteSpace="pre-wrap">
              {this.state.error.message}
            </Text>
          )}
        </Center>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;