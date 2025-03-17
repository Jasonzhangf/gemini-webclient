import { Box, Grid, GridItem, ChakraProvider, IconButton, Flex, Center, Text } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { queryClient } from './config/query';
import { theme } from './config/theme';
import SessionList from './components/SessionList';
import ChatWindow from './components/ChatWindow';
import ConfigModal from './components/ConfigModal';
import SettingsPage from './components/SettingsPage';
import ErrorBoundary from './components/ErrorBoundary';
import { SettingsIcon } from '@chakra-ui/icons';

function App() {
  const isConfigured = useAppStore((state) => state.isConfigured);
  const showConfig = useAppStore((state) => state.showConfig);
  const setConfig = useAppStore((state) => state.setConfig);
  const addLog = useAppStore((state) => state.addLog);
  const [showSettings, setShowSettings] = useState(false);

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
          <Flex direction="column" h="full">
            <Flex justify="flex-end" mb={4}>
              <IconButton
                aria-label="Settings"
                icon={<SettingsIcon />}
                onClick={() => setShowSettings(!showSettings)}
              />
            </Flex>
            {showSettings ? (
              <SettingsPage />
            ) : (
              <Grid
                templateColumns="250px 1fr"
                gap={4}
                flex={1}
              >
                <GridItem>
                  <SessionList />
                </GridItem>
                <GridItem>
                  <ChatWindow />
                </GridItem>
              </Grid>
            )}
          </Flex>
          {!isConfigured || showConfig ? <ConfigModal /> : null}
        </Box>
      </ChakraProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App
