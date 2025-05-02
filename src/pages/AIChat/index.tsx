import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Container,
    TextField,
    Button,
    Paper,
    Typography,
    CircularProgress,
    useTheme,
    Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_URL } from '../../config/api';
import AppHeader from '../../Components/AppHeader/AppHeader';
import { getAuthData } from '../../utils/auth';

const socket = io(API_URL.replace('/api/v1', ''));

interface LocationState {
    pesoTotal?: number;
    temperatura?: number;
    pressaoArterial?: string;
}

interface PacienteData {
    nomeCompleto: string;
    idade: number;
    genero: string;
}

interface Message {
    text: string;
    isUser: boolean;
    isTyping?: boolean;
}

const AIChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInQueue, setIsInQueue] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = getAuthData();
    const state = location.state as LocationState;
    const [pacientAge, setPacientAge] = useState<number | null>(null);
    const [pacientGender, setPacientGender] = useState<string | null>(null);
    const [pacientName, setPacientName] = useState<string | null>(null);

    const fetchPacienteData = async (pacienteId: string) => {
        try {
            const response = await fetch(`${API_URL}/pacientes/${pacienteId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar dados do paciente');
            }

            const data: PacienteData = await response.json();
            setPacientAge(data.idade);
            setPacientGender(data.genero);
            setPacientName(data.nomeCompleto);
        } catch (error) {
            console.error('Erro ao buscar dados do paciente:', error);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;
        fetchPacienteData(userId);

        // Escuta quando um paciente é aceito
        socket.on("acceptPatient", (data) => {
            const chatRoom = `chat-${userId}-${data.medicoId}`;
            // Remove o paciente da fila antes de navegar
            socket.emit("leaveQueue", { pacienteId: userId });
            navigate('/medicalChat', {
                state: {
                    sala: chatRoom,
                    remetenteId: data.medicoId
                }
            });
        });

        return () => {
            socket.off("acceptPatient");
        };
    }, [token, navigate]);

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;
        fetchPacienteData(userId);
    }, [token, navigate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const typeMessage = (text: string, index: number) => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex <= text.length) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[index] = {
                        ...newMessages[index],
                        text: text.slice(0, currentIndex),
                        isTyping: currentIndex < text.length
                    };
                    return newMessages;
                });
                currentIndex++;
                scrollToBottom();
            } else {
                clearInterval(interval);
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[index] = {
                        ...newMessages[index],
                        isTyping: false
                    };
                    return newMessages;
                });
            }
        }, 30);
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
        setIsLoading(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${API_URL}/ia/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: userMessage,
                }),
            });

            const data = await response.json();
            const newMessageIndex = messages.length + 1;

            let cleanResponse = data.response
                .replace(/<\|im_start\|>.*$/g, '')
                .replace(/^[^a-zA-Z0-9á-úÁ-Ú]+/g, '')
                .trim();
            setMessages(prev => [...prev, { text: '', isUser: false, isTyping: true }]);
            typeMessage(cleanResponse, newMessageIndex);
        } catch (error) {
            setMessages(prev => [...prev, { text: 'Desculpe, ocorreu um erro. Tente novamente.', isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleEndChat = () => {
        if (!token) return;
        
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;
        
        if (isInQueue) {
            socket.emit("leaveQueue", { pacienteId: userId });
        }
        navigate('/patientHome');
    };

    const handleRequestDoctor = async () => {
        if (!token || !pacientAge || !pacientGender) {
            setMessages(prev => [...prev, { 
                text: 'Não foi possível solicitar atendimento. Tente novamente mais tarde.', 
                isUser: false 
            }]);
            return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;

        try {
            // Entra na fila
            socket.emit("enterQueue", {
                pacienteId: userId,
                nomeCompleto: pacientName,
                idade: pacientAge,
                genero: pacientGender,
                pesoTotal: state?.pesoTotal || 0,
                temperatura: state?.temperatura || 0,
                pressaoArterial: state?.pressaoArterial || "0/0",
                horaChegada: new Date().toLocaleString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })
            });

            setIsInQueue(true);
            setMessages(prev => [...prev, { 
                text: 'Sua solicitação de atendimento foi registrada. Um médico irá atendê-lo em breve.', 
                isUser: false 
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { 
                text: 'Ocorreu um erro ao solicitar atendimento. Tente novamente mais tarde.', 
                isUser: false 
            }]);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <AppHeader />
            <Container maxWidth="md" sx={{ flex: 1, py: 1, mt: 8, height: 'calc(100vh - 64px)' }}>
                <Paper
                    elevation={3}
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: theme.palette.background.paper,
                        borderRadius: 1,
                        overflow: 'hidden',
                        maxHeight: 'calc(100vh - 80px)',
                    }}
                >
                    <Box 
                        sx={{ 
                            p: 1.5, 
                            borderBottom: 1, 
                            borderColor: 'divider',
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            flexShrink: 0,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="h6">
                            Chat com IA
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<LocalHospitalIcon />}
                                onClick={handleRequestDoctor}
                                size="small"
                            >
                                Solicitar Médico
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<ExitToAppIcon />}
                                onClick={handleEndChat}
                                size="small"
                            >
                                Encerrar Chat
                            </Button>
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            overflow: 'auto',
                            p: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            bgcolor: theme.palette.background.default,
                            height: 'calc(100vh - 200px)',
                            minHeight: '400px',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: theme.palette.background.paper,
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: theme.palette.primary.main,
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: theme.palette.primary.dark,
                            },
                        }}
                    >
                        {messages.map((message, index) => (
                            <Box
                                key={index}
                                sx={{
                                    alignSelf: message.isUser ? 'flex-end' : 'flex-start',
                                    maxWidth: '70%',
                                    display: 'flex',
                                    justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 1.5,
                                        bgcolor: message.isUser ? theme.palette.primary.main : theme.palette.background.paper,
                                        color: message.isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
                                        borderRadius: 1,
                                        position: 'relative',
                                    }}
                                >
                                    <Typography variant="body2">
                                        {message.text}
                                        {!message.isUser && message.isTyping && (
                                            <Box
                                                component="span"
                                                sx={{
                                                    display: 'inline-block',
                                                    width: '4px',
                                                    height: '16px',
                                                    bgcolor: 'currentColor',
                                                    ml: 0.5,
                                                    animation: 'blink 1s infinite',
                                                    '@keyframes blink': {
                                                        '0%': { opacity: 1 },
                                                        '50%': { opacity: 0 },
                                                        '100%': { opacity: 1 },
                                                    },
                                                }}
                                            />
                                        )}
                                    </Typography>
                                </Paper>
                            </Box>
                        ))}
                        {isLoading && (
                            <Box sx={{ alignSelf: 'flex-start' }}>
                                <CircularProgress size={16} />
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    <Box 
                        sx={{ 
                            p: 1.5, 
                            borderTop: 1, 
                            borderColor: 'divider',
                            bgcolor: theme.palette.background.paper,
                            flexShrink: 0
                        }}
                    >
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={3}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Digite sua mensagem..."
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: theme.palette.background.default,
                                        minHeight: '40px',
                                        borderRadius: 1,
                                    }
                                }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                sx={{ 
                                    minWidth: '40px',
                                    width: '40px',
                                    height: '40px',
                                    alignSelf: 'flex-end',
                                    p: 0,
                                    borderRadius: 1,
                                }}
                            >
                                <SendIcon fontSize="small" />
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default AIChat; 