import { ChakraProvider, Box, Grid, GridItem, Text, Center, extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'white',
      },
    },
  },
});
import { QueryClient, QueryClientProvider } from 'react-query';
import { useEffect, Component, ReactNode } from 'react';
import SessionList from './components/SessionList';
import ChatWindow from './components/ChatWindow';
import ConfigModal from './components/ConfigModal';
import { useAppStore } from './store';

const queryClient = new QueryClient();

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

function App() {
  const isConfigured = useAppStore((state) => state.isConfigured);
  const showConfig = useAppStore((state) => state.showConfig);
  const setConfig = useAppStore((state) => state.setConfig);
  const addLog = useAppStore((state) => state.addLog);

  useEffect(() => {
    addLog('info', '应用初始化');
  }, []);

  useEffect(() => {
    const savedConfig = localStorage.getItem('geminiConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setConfig(config);
      } catch (error) {
        console.error('Failed to parse saved config:', error);
        addLog('error', '配置加载失败', { error });
      }
    } else {
      // 如果没有保存的配置，显示配置窗口
      useAppStore.getState().setShowConfig(true);
    }
  }, [isConfigured, setConfig, addLog]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
        <Box h="100vh" p={4}>
          <Grid
            templateColumns="250px 1fr"
            gap={4}
            h="full"
          >
            <GridItem>
              <SessionList />
            </GridItem>
            <GridItem>
              <ChatWindow />
            </GridItem>
          </Grid>
          {!isConfigured || showConfig ? <ConfigModal /> : null}
        </Box>
      </ChakraProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App
