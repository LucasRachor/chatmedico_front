import React, { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Button, TextField, Paper, List, ListItem, ListItemText } from "@mui/material";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { getAuthData } from "../../utils/auth";

const socket = io("http://localhost:4000");

const MedicalChat: React.FC = () => {
  const [isWaiting, setIsWaiting] = useState(true);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [message, setMessage] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const [sala, setSala] = useState<string | null>(null);
  const navigate = useNavigate();
  const { token } = getAuthData();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    // Decodifica o token para obter o ID do paciente
    const payload = JSON.parse(atob(token.split('.')[1]));
    const patientId = payload.sub;
    const patientName = payload.username;

    // Entra na fila
    socket.emit("enterQueue", {
      pacienteId: patientId,
      name: patientName
    });

    // Escuta quando o médico aceita o paciente
    socket.on("acceptPatient", (data) => {
      const chatRoom = `chat-${patientId}-${data.medicoId}`;
      setSala(chatRoom);
      setChatStarted(true);
      setIsWaiting(false);
    });

    // Escuta mensagens do chat
    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("acceptPatient");
      socket.off("message");
    };
  }, [token, navigate]);

  const sendMessage = () => {
    if (!token || !sala) return;

    if (message.trim() !== "") {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const remetenteId = payload.sub;

      const messagePayload = {
        sala: sala,
        remetenteId: remetenteId,
        mensagem: message
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
    return senderId === payload.sub ? "Você" : "Médico";
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
          <Typography variant="h5">Chat com o Médico</Typography>
          <Paper sx={{ height: 300, overflowY: "auto", mt: 2, p: 2 }}>
            <List>
              {messages.map((msg, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={msg.text}
                    secondary={getSenderName(msg.sender)}
                  />
                </ListItem>
              ))}
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
