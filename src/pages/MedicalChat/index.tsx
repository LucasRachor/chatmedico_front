import React, {
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
} from "@mui/material";
import { io } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuthData } from "../../utils/auth";
import { decodeJwtToken } from "../../utils/jwt";
import api, { API_URL } from "../../config/api";
import AppHeader from "../../Components/AppHeader/AppHeader";
import VideoPanel from "../../Components/VideoPanel/VideoPanel";
import { useVideoChat } from "../../hooks/useVideoChat";

const socket = io(API_URL.replace("/api/v1", ""));

interface LocationState {
  riskRating: any;
  sala?: string;
  remetenteId?: string;
  mensagemInicial?: string;
  pesoTotal?: number;
  temperatura?: number;
  pressaoArterial?: string;
  nomeCompleto?: string;
}

interface PacienteData {
  nomeCompleto: string;
  idade: number;
  genero: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  senderName: string;
  senderRole: string;
}

const SESSION_KEY = "activeChatSession";

interface ChatSession {
  sala: string;
  otherName: string;
  otherRole: string;
  currentUserName: string;
}

const saveChatSession = (session: ChatSession) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const loadChatSession = (): ChatSession | null => {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const clearChatSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

const getRoleLabel = (role: string): string => {
  switch (role) {
    case "medico":
      return "Médico";
    case "enfermeiro":
      return "Enfermeiro";
    case "paciente":
      return "Paciente";
    case "admin":
      return "Admin";
    default:
      return role;
  }
};

const MedicalChat: React.FC = () => {
  // Tenta restaurar sessão do sessionStorage (caso de F5/reload)
  const savedSession = useRef(loadChatSession());

  const [isWaiting, setIsWaiting] = useState(() => !savedSession.current);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [chatStarted, setChatStarted] = useState(() => !!savedSession.current);
  const [sala, setSala] = useState<string | null>(
    () => savedSession.current?.sala || null,
  );
  const [pacientAge, setPacientAge] = useState<number | null>(null);
  const [pacientGender, setPacientGender] = useState<string | null>(null);
  const [pacientName, setPacientName] = useState<string | null>(null);
  const [otherParticipantName, setOtherParticipantName] = useState<string>(
    () => savedSession.current?.otherName || "",
  );
  const [otherParticipantRole, setOtherParticipantRole] = useState<string>(
    () => savedSession.current?.otherRole || "",
  );
  const [storedUserName, setStoredUserName] = useState<string>(
    () => savedSession.current?.currentUserName || "",
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { token } = getAuthData();
  const state = location.state as LocationState;
  const initialMessageSent = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRestoredSession = useRef(!!savedSession.current);

  // Decodifica token uma vez só
  const decoded = token ? decodeJwtToken(token) : null;
  const userId = decoded?.sub;
  const userRole = decoded?.role;

  // Nome do usuário atual para enviar nas mensagens
  const currentUserName =
    storedUserName ||
    (state?.sala ? state.nomeCompleto || "" : pacientName || "");

  // Video chat hook
  const videoChat = useVideoChat({
    socket,
    sala,
    currentUserName,
    currentUserRole: userRole || "",
  });

  const fetchPacienteData = async (pacienteId: string) => {
    try {
      const { data } = await api.get<PacienteData>(`/pacientes/${pacienteId}`);
      setPacientAge(data.idade);
      setPacientGender(data.genero);
      setPacientName(data.nomeCompleto);
    } catch (error) {
      console.error("Erro ao buscar dados do paciente:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect principal: setup do chat (médico ou paciente)
  useEffect(() => {
    if (!token || !userId || !userRole) {
      navigate("/");
      return;
    }

    // Sessão restaurada após F5 — apenas re-entra na sala
    if (isRestoredSession.current && sala) {
      isRestoredSession.current = false;
      socket.emit("joinRoom", { sala });
    }
    // Se vier do componente Patient (médico), já inicia o chat
    else if (state?.sala && state?.remetenteId) {
      setSala(state.sala);
      setChatStarted(true);
      setIsWaiting(false);
      setStoredUserName(state.nomeCompleto || "");

      // Persiste sessão para sobreviver a F5
      saveChatSession({
        sala: state.sala,
        otherName: "",
        otherRole: "paciente",
        currentUserName: state.nomeCompleto || "",
      });

      socket.emit("joinRoom", { sala: state.sala });

      // Envia mensagem inicial apenas uma vez
      if (state.mensagemInicial && !initialMessageSent.current) {
        const messagePayload = {
          sala: state.sala,
          remetenteId: state.remetenteId,
          mensagem: state.mensagemInicial,
          nomeRemetente: state.nomeCompleto || "",
          roleRemetente: userRole,
        };
        socket.emit("sendMessage", messagePayload);
        initialMessageSent.current = true;
      }
    } else {
      // Se for paciente, busca os dados e entra na fila
      fetchPacienteData(userId);
    }

    // Escuta mensagens do chat
    socket.on(
      "message",
      (data: {
        mensagem: string;
        remetenteId: string;
        nomeRemetente: string;
        roleRemetente: string;
      }) => {
        if (
          !(
            data.mensagem === state?.mensagemInicial &&
            initialMessageSent.current
          )
        ) {
          setMessages((prev) => [
            ...prev,
            {
              sender: data.remetenteId,
              text: data.mensagem,
              senderName: data.nomeRemetente || "",
              senderRole: data.roleRemetente || "",
            },
          ]);
        }
      },
    );

    // Escuta quando o chat é encerrado
    socket.on("chatEnded", (data: { pacienteId: string }) => {
      clearChatSession();

      const pacienteId = userRole === "paciente" ? userId : data.pacienteId;
      if (pacienteId) {
        socket.emit("leaveQueue", { pacienteId });
      }

      if (userRole === "medico" || userRole === "enfermeiro") {
        navigate("/patient");
      } else {
        navigate("/patientHome");
      }
    });

    // Detecta fechamento da aba/navegador para encerrar chat
    const handleBeforeUnload = () => {
      if (sala && userId) {
        socket.emit("endChat", {
          sala,
          pacienteId: userRole === "paciente" ? userId : state?.remetenteId,
          medicoId: userRole === "medico" || userRole === "enfermeiro" ? userId : state?.remetenteId,
        });
        const pacienteId = userRole === "paciente" ? userId : state?.remetenteId;
        if (pacienteId) {
          socket.emit("leaveQueue", { pacienteId });
        }
        clearChatSession();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      socket.off("acceptPatient");
      socket.off("message");
      socket.off("endChat");
      socket.off("chatEnded");
    };
  }, [token, navigate, state, sala, userId, userRole]);

  // Effect para paciente: entrar na fila e escutar acceptPatient
  useEffect(() => {
    if (!token || !userId || !pacientAge || !pacientGender) return;

    socket.emit("enterQueue", {
      pacienteId: userId,
      nomeCompleto: pacientName,
      idade: pacientAge,
      genero: pacientGender,
      riskRating: state?.riskRating,
      pesoTotal: state?.pesoTotal || 0,
      temperatura: state?.temperatura || 0,
      pressaoArterial: state?.pressaoArterial || "0/0",
      horaChegada: new Date().toLocaleString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });

    socket.on(
      "acceptPatient",
      (data: {
        medicoId: string;
        nomeCompletoMedico: string;
        roleMedico: string;
      }) => {
        const chatRoom = `chat-${userId}-${data.medicoId}`;
        setSala(chatRoom);
        setChatStarted(true);
        setIsWaiting(false);

        // Guarda info do médico que aceitou
        const otherName = data.nomeCompletoMedico || "";
        const otherRole = data.roleMedico || "";
        setOtherParticipantName(otherName);
        setOtherParticipantRole(otherRole);

        // Persiste sessão para sobreviver a F5
        saveChatSession({
          sala: chatRoom,
          otherName,
          otherRole,
          currentUserName: pacientName || "",
        });

        socket.emit("joinRoom", { sala: chatRoom });
      },
    );

    return () => {
      if (!chatStarted) {
        socket.emit("leaveQueue", { pacienteId: userId });
      }
      socket.off("acceptPatient");
    };
  }, [
    token,
    pacientAge,
    pacientGender,
    pacientName,
    state?.pesoTotal,
    chatStarted,
  ]);

  const sendMessage = () => {
    if (!userId || !userRole || !sala) return;

    if (message.trim() !== "") {
      const messagePayload = {
        sala,
        remetenteId: userId,
        mensagem: message,
        nomeRemetente: currentUserName,
        roleRemetente: userRole,
      };

      socket.emit("sendMessage", messagePayload);
      setMessage("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  const getSenderLabel = (msg: ChatMessage): string => {
    if (msg.sender === userId) return "Você";
    if (msg.senderName && msg.senderRole) {
      return `${msg.senderName} - ${getRoleLabel(msg.senderRole)}`;
    }
    // Fallback para mensagens sem nome/role
    return userRole === "medico" || userRole === "enfermeiro"
      ? "Paciente"
      : "Médico";
  };

  const isCurrentUser = (senderId: string): boolean => {
    return senderId === userId;
  };

  const handleEndChat = () => {
    if (!userId || !userRole || !sala) return;

    clearChatSession();

    socket.emit("endChat", {
      sala,
      pacienteId: userRole === "paciente" ? userId : state?.remetenteId,
      medicoId: userRole === "medico" ? userId : state?.remetenteId,
    });

    const pacienteId = userRole === "paciente" ? userId : state?.remetenteId;
    if (pacienteId) {
      socket.emit("leaveQueue", { pacienteId });
    }

    if (userRole === "medico" || userRole === "enfermeiro") {
      navigate("/patient");
    } else {
      navigate("/patientHome");
    }
  };

  const getHeaderTitle = (): string => {
    if (otherParticipantName && otherParticipantRole) {
      return `Chat com ${otherParticipantName} - ${getRoleLabel(otherParticipantRole)}`;
    }
    switch (userRole) {
      case "paciente":
        return "Chat com o Médico";
      case "medico":
      case "enfermeiro":
        return "Chat com o Paciente";
      default:
        return "Chat Médico";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        maxWidth: "900px",
        margin: "auto",
        mt: { xs: 8, sm: 12 },
        px: { xs: 1, sm: 2 },
        pb: { xs: 1, sm: 2 },
        width: "100%",
      }}
    >
      <AppHeader />

      {isWaiting ? (
        <Box sx={{ textAlign: "center", mt: { xs: 4, sm: 8 } }}>
          <Typography variant="h5" sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>
            Aguardando atendimento...
          </Typography>
          <CircularProgress sx={{ mt: 3 }} />
          <Typography variant="body1" sx={{ mt: 2, color: "text.secondary" }}>
            Um profissional estará disponível em breve.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: { xs: 1, sm: 2 },
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontSize: { xs: "1rem", sm: "1.5rem" }, flex: 1, minWidth: 0 }}
              noWrap
            >
              {getHeaderTitle()}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleEndChat}
              size="small"
              sx={{ flexShrink: 0 }}
            >
              Encerrar Chat
            </Button>
          </Box>

          {/* Painel de vídeo */}
          <VideoPanel {...videoChat} />

          {/* Área de mensagens */}
          <Paper
            sx={{
              height: videoChat.isCallActive
                ? { xs: "calc(100dvh - 500px)", sm: "calc(100vh - 640px)" }
                : { xs: "calc(100dvh - 240px)", sm: "calc(100vh - 320px)" },
              minHeight: 150,
              overflowY: "auto",
              p: { xs: 1, sm: 2 },
              WebkitOverflowScrolling: "touch",
            }}
          >
            <List disablePadding>
              {messages.map((msg, index) => (
                <ListItem
                  key={index}
                  sx={{
                    justifyContent: isCurrentUser(msg.sender)
                      ? "flex-end"
                      : "flex-start",
                    padding: { xs: "3px 8px", sm: "4px 16px" },
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: { xs: "85%", sm: "70%" },
                      backgroundColor: isCurrentUser(msg.sender)
                        ? "primary.main"
                        : "grey.200",
                      color: isCurrentUser(msg.sender)
                        ? "white"
                        : "text.primary",
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      textAlign: isCurrentUser(msg.sender) ? "right" : "left",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        fontWeight: 600,
                        mb: 0.3,
                        opacity: 0.85,
                      }}
                    >
                      {getSenderLabel(msg)}
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                      {msg.text}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          </Paper>

          {/* Input de mensagem */}
          <Box
            sx={{
              display: "flex",
              mt: { xs: 1, sm: 2 },
              gap: 1,
              pb: { xs: "env(safe-area-inset-bottom, 0px)", sm: 0 },
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMessage(e.target.value)
              }
              onKeyDown={handleKeyDown}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: 44,
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={sendMessage}
              disabled={!chatStarted}
              sx={{ minWidth: { xs: 60, sm: 80 }, flexShrink: 0 }}
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
