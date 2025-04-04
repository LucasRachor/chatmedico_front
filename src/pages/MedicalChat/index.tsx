import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, CircularProgress, Button, TextField, Paper, List, ListItem, } from "@mui/material";
import { io } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthData } from "../../utils/auth";

const socket = io("http://localhost:4000");

interface LocationState {
  sala?: string;
  remetenteId?: string;
  mensagemInicial?: string;
  pesoTotal?: number;
}

interface PacienteData {
  nome_completo: string;
  idade: number;
  genero: string;
}

const MedicalChat: React.FC = () => {
  const [isWaiting, setIsWaiting] = useState(true);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [message, setMessage] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [sala, setSala] = useState<string | null>(null);
  const [pacientAge, setPacientAge] = useState<number | null>(null);
  const [pacientGender, setPacientGender] = useState<string | null>(null);
  const [pacientName, setPacientName] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = getAuthData();
  const state = location.state as LocationState;
  const initialMessageSent = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchPacienteData = async (pacienteId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/pacientes/${pacienteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do paciente');
      }

      const data: PacienteData = await response.json();
      console.log(data)
      setPacientAge(data.idade);
      setPacientGender(data.genero);
      setPacientName(data.nome_completo);
    } catch (error) {
      console.error('Erro ao buscar dados do paciente:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;
    const userRole = payload.role;

    // Se vier do componente Patient (médico), já inicia o chat
    if (state?.sala && state?.remetenteId) {
      setSala(state.sala);
      setChatStarted(true);
      setIsWaiting(false);

      // Entra na sala do chat
      socket.emit("joinRoom", { sala: state.sala });

      // Envia mensagem inicial apenas uma vez
      if (state.mensagemInicial && !initialMessageSent.current) {
        const messagePayload = {
          sala: state.sala,
          remetenteId: state.remetenteId,
          mensagem: state.mensagemInicial,
          role: userRole
        };
        socket.emit("sendMessage", messagePayload);
        initialMessageSent.current = true;
      }
    } else {
      // Se for paciente, busca os dados e entra na fila
      fetchPacienteData(userId);
    }

    // Escuta quando um paciente é aceito
    socket.on("acceptPatient", (data) => {
      const chatRoom = `chat-${userId}-${data.medicoId}`;
      setSala(chatRoom);
      setChatStarted(true);
      setIsWaiting(false);

      // Entra na sala do chat
      socket.emit("joinRoom", { sala: chatRoom });
    });

    // Escuta mensagens do chat
    socket.on("message", (data) => {
      console.log("Mensagem recebida:", data);
      // Não adiciona a mensagem se for a mensagem inicial e já tiver sido enviada
      if (!(data.mensagem === state?.mensagemInicial && initialMessageSent.current)) {
        setMessages((prev) => [...prev, { sender: data.remetenteId, text: data.mensagem }]);
      }
    });

    // Escuta quando o chat é encerrado
    socket.on("chatEnded", (data) => {
      // Remove o paciente da fila
      const pacienteId = userRole === "paciente" ? userId : data.pacienteId;
      if (pacienteId) {
        socket.emit("leaveQueue", { pacienteId });
      }

      if (userRole === "medico") {
        navigate("/patient");
      } else {
        navigate("/patientHome");
      }
    });

    return () => {
      if (sala) {
        // Remove o paciente da fila ao desmontar o componente
        const pacienteId = userRole === "paciente" ? userId : state?.remetenteId;
        if (pacienteId) {
          socket.emit("leaveQueue", { pacienteId });
        }
        socket.emit("endChat", { sala });
      }
      socket.off("acceptPatient");
      socket.off("message");
      socket.off("endChat");
      socket.off("chatEnded");
    };
  }, [token, navigate, state, sala]);

  // Novo useEffect para atualizar a fila quando os dados do paciente forem recebidos
  useEffect(() => {
    if (!token || !pacientAge || !pacientGender) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    // Emite o evento de entrar na fila
    socket.emit("enterQueue", {
      pacienteId: userId,
      nome_completo: pacientName,
      idade: pacientAge,
      genero: pacientGender,
      pesoTotal: state?.pesoTotal || 0,
      horaChegada: new Date().toLocaleString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    });

    // Escuta quando o paciente é aceito
    socket.on("acceptPatient", (data) => {
      const chatRoom = `chat-${userId}-${data.medicoId}`;
      setSala(chatRoom);
      setChatStarted(true);
      setIsWaiting(false);

      // Entra na sala do chat
      socket.emit("joinRoom", { sala: chatRoom });
    });

    return () => {
      // Remove o paciente da fila quando o componente é desmontado
      if (!chatStarted) {
        socket.emit("leaveQueue", { pacienteId: userId });
      }
      socket.off("acceptPatient");
    };
  }, [token, pacientAge, pacientGender, pacientName, state?.pesoTotal, chatStarted]);

  const sendMessage = () => {
    if (!token || !sala) return;

    if (message.trim() !== "") {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const remetenteId = payload.sub;
      const userRole = payload.role;

      const messagePayload = {
        sala: sala,
        remetenteId: remetenteId,
        mensagem: message,
        role: userRole
      };

      socket.emit("sendMessage", messagePayload);
      setMessage("");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const getSenderName = (senderId: string) => {
    if (!token) return "Desconhecido";
    const payload = JSON.parse(atob(token.split('.')[1]));
    return senderId === payload.sub ? "Você" : (payload.role === "medico" ? "Paciente" : "Médico");
  };

  const isCurrentUser = (senderId: string) => {
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return senderId === payload.sub;
  };

  const handleEndChat = () => {
    if (!token || !sala) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;
    const userRole = payload.role;

    // Emite o evento de encerrar chat
    socket.emit("endChat", {
      sala: sala,
      pacienteId: userRole === "paciente" ? userId : state?.remetenteId,
      medicoId: userRole === "medico" ? userId : state?.remetenteId
    });

    // Remove o paciente da fila
    const pacienteId = userRole === "paciente" ? userId : state?.remetenteId;
    if (pacienteId) {
      socket.emit("leaveQueue", { pacienteId });
    }

    // Redireciona baseado no papel do usuário
    if (userRole === "medico") {
      navigate("/patient");
    } else {
      navigate("/patientHome");
    }
  };

  return (
    <Box sx={{ maxWidth: "600px", margin: "auto", mt: 5, textAlign: "center" }}>
      {isWaiting ? (
        <Box>
          <Typography variant="h5">Aguardando atendimento...</Typography>
          <CircularProgress sx={{ mt: 2 }} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Um médico estará disponível em breve.
          </Typography>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Chat com o {state?.remetenteId ? "Paciente" : "Médico"}</Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleEndChat}
              sx={{ ml: 2 }}
            >
              Encerrar Chat
            </Button>
          </Box>
          <Paper sx={{ height: 300, overflowY: "auto", mt: 2, p: 2 }}>
            <List>
              {messages.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    justifyContent: isCurrentUser(msg.sender) ? 'flex-end' : 'flex-start',
                    padding: '8px 16px'
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      backgroundColor: isCurrentUser(msg.sender) ? 'primary.main' : 'grey.200',
                      color: isCurrentUser(msg.sender) ? 'white' : 'text.primary',
                      borderRadius: 2,
                      padding: 1,
                      textAlign: isCurrentUser(msg.sender) ? 'right' : 'left'
                    }}
                  >
                    <Typography variant="body1">{msg.text}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      {getSenderName(msg.sender)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Paper>
          <Box sx={{ display: "flex", mt: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={sendMessage}
              sx={{ ml: 2 }}
              disabled={!chatStarted}
            >
              Enviar
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MedicalChat;
