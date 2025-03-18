import { Box, Grid, GridItem, ChakraProvider, IconButton, Flex, Center, Text } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import { queryClient } from './config/query';
import { theme } from './config/theme';
import SessionList from './components/SessionList';
import ChatWindow from './components/ChatWindow';
import ConfigModal from './components/ConfigModal';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import { SettingsIcon } from '@chakra-ui/icons';

function App() {
  const isConfigured = useAppStore((state) => state.isConfigured);
  const showConfig = useAppStore((state) => state.showConfig);
  const setConfig = useAppStore((state) => state.setConfig);
  const addLog = useAppStore((state) => state.addLog);
  const [showSettings, setShowSettings] = useState(false);
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    addLog('info', '应用初始化');
    
    // 检查本地存储的登录状态
    const userAuth = localStorage.getItem('userAuth');
    if (userAuth) {
      const { username, isLoggedIn } = JSON.parse(userAuth);
      setUser({ username, isLoggedIn, rememberMe: true });
    }
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
      useAppStore.getState().setShowConfig(true);
    }
  }, [isConfigured, setConfig, addLog]);

  const MainContent = () => (
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
          <Box flex={1}>
            <Grid
              templateColumns={{ base: "1fr", md: "250px 1fr" }}
              templateRows={{ base: "auto 1fr", md: "1fr" }}
              gap={4}
              h="full"
            >
              <GridItem colSpan={{ base: 1, md: 1 }} rowSpan={1}>
                <SessionList />
              </GridItem>
              <GridItem colSpan={1} rowSpan={1}>
                <ChatWindow />
              </GridItem>
            </Grid>
          </Box>
        )}
      </Flex>
      {!isConfigured || showConfig ? <ConfigModal /> : null}
    </Box>
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <Router>
            <Routes>
              <Route path="/login" element={user?.isLoggedIn ? <Navigate to="/" /> : <LoginPage />} />
              <Route
                path="/*"
                element={
                  user?.isLoggedIn ? (
                    <MainContent />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
            </Routes>
          </Router>
        </ChakraProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App
