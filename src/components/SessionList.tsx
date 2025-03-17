import {
  VStack,
  Box,
  Text,
  IconButton,
  HStack,
  Input,
  Button,
  Tabs,
  TabList,
  Tab,
  useBreakpointValue,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAppStore } from '../store';
import { ChatSession, openGeminiDB } from '../utils/db';
import { useEffect, useState } from 'react';

const SessionList = () => {
  const { sessions, currentSession, setCurrentSession, setSessions } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    // 从IndexedDB加载会话列表
    const loadSessions = async () => {
      try {
        const db = await openGeminiDB();
        const allSessions = await db.getAll('sessions');
        setSessions(allSessions);
        
        // 如果没有会话，自动创建第一个会话
        if (allSessions.length === 0) {
          const newSession: ChatSession = {
            id: Date.now().toString(),
            title: '新会话 1',
            messages: [],
            lastUpdated: Date.now(),
          };
          await db.add('sessions', newSession);
          setSessions([newSession]);
          setCurrentSession(newSession);
        } else if (!currentSession) {
          // 如果有会话但没有选中的会话，选择第一个会话
          setCurrentSession(allSessions[0]);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
        // 删除旧的数据库实例，以便重新初始化
        await window.indexedDB.deleteDatabase('gemini-chat');
        // 重新加载页面以重新初始化数据库
        window.location.reload();
      }
    };
    loadSessions();
  }, []);

  const createNewSession = async () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `新会话 ${sessions.length + 1}`,
      messages: [],
      lastUpdated: Date.now(),
    };
    try {
      const db = await openGeminiDB();
      await db.add('sessions', newSession);
      setSessions([...sessions, newSession]);
      setCurrentSession(newSession);
    } catch (error) {
      console.error('Failed to create new session:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const db = await openGeminiDB();
      await db.delete('sessions', sessionId);
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(updatedSessions);
      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSessions[0] || null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const startEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const saveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return;

    const session = sessions.find(s => s.id === editingId);
    if (!session) return;

    const updatedSession = { ...session, title: editingTitle.trim() };
    const db = await openGeminiDB();
    await db.put('sessions', updatedSession);
    updateSession(updatedSession);
    setEditingId(null);
    setEditingTitle('');
  };

  const updateSession = (updatedSession: ChatSession) => {
    setSessions(sessions.map(s => s.id === updatedSession.id ? updatedSession : s));
    if (currentSession?.id === updatedSession.id) {
      setCurrentSession(updatedSession);
    }
  };

  const isMobile = useBreakpointValue({ base: true, md: false });

  const renderSessionItem = (session: ChatSession) => (
    <HStack
      key={session.id}
      p={2}
      bg={currentSession?.id === session.id ? 'blue.50' : 'transparent'}
      _hover={{ bg: 'gray.50' }}
      cursor="pointer"
      onClick={() => setCurrentSession(session)}
    >
      {editingId === session.id ? (
        <Input
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={saveEdit}
          onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
          autoFocus
          size="sm"
          flex={1}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <Text flex={1} isTruncated onDoubleClick={() => startEdit(session)}>
          {session.title}
        </Text>
      )}
      <IconButton
        aria-label="删除会话"
        icon={<DeleteIcon />}
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          deleteSession(session.id);
        }}
      />
    </HStack>
  )

  return (
    <Box h={isMobile ? "auto" : "full"} borderRight={isMobile ? "none" : "1px"} borderColor="gray.200">
      <Button
        leftIcon={<AddIcon />}
        colorScheme="blue"
        variant="ghost"
        w="full"
        justifyContent="flex-start"
        mb={4}
        onClick={createNewSession}
      >
        新建会话
      </Button>
      {isMobile ? (
        <Tabs variant="soft-rounded" colorScheme="blue" mb={4}>
          <TabList>
            {sessions.map((session) => (
              <Tab
                key={session.id}
                isSelected={currentSession?.id === session.id}
                onClick={() => setCurrentSession(session)}
                position="relative"
              >
                <Text isTruncated maxW="150px">
                  {session.title}
                </Text>
                <IconButton
                  aria-label="删除会话"
                  icon={<DeleteIcon />}
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  right="-2"
                  top="-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                />
              </Tab>
            ))}
          </TabList>
        </Tabs>
      ) : (
        <VStack spacing={2} align="stretch">
          {sessions.map(renderSessionItem)}
        </VStack>
      )}
    </Box>
  );
};

export default SessionList;