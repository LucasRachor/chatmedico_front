import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sala: string;
  remetenteId: string;
  mensagem: string;
  timestamp: string;
}

const ChatHistory: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const pacienteId = "chat-cm8x91w160002j218osmezlyu-cm8x9og5q0004j218wxyu075p"; // Este ID deve vir do contexto de autenticação

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/v1/chat/historico/${pacienteId}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [pacienteId]);

  const groupMessagesByDate = (messages: Message[]) => {
    const grouped = messages.reduce((acc, message) => {
      const date = format(new Date(message.timestamp), 'dd/MM/yyyy');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(message);
      return acc;
    }, {} as Record<string, Message[]>);

    return Object.entries(grouped).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" sx={{ mt: 4, mb: 3, textAlign: 'center' }}>
        Histórico de Conversas
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        {groupMessagesByDate(messages).map(([date, dayMessages]) => (
          <Box key={date} sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                backgroundColor: '#f5f5f5',
                p: 1,
                borderRadius: 1,
                mb: 2
              }}
            >
              {format(new Date(date.split('/').reverse().join('-')), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Typography>
            {dayMessages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.remetenteId === pacienteId ? 'flex-end' : 'flex-start',
                  mb: 2
                }}
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    backgroundColor: message.remetenteId === pacienteId ? '#DCF8C6' : '#E8E8E8',
                    borderRadius: 2,
                    p: 2,
                    position: 'relative'
                  }}
                >
                  <Typography variant="body1">{message.mensagem}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      textAlign: 'right',
                      mt: 0.5
                    }}
                  >
                    {format(new Date(message.timestamp), 'HH:mm')}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        ))}
      </Paper>
    </Container>
  );
};

export default ChatHistory; 