import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";
import AppHeader from "../../Components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAuthData } from "../../utils/auth";
import { API_URL } from "../../config/api";
import { useSocket } from "../../utils/SocketContext";

interface QueuePatient {
  pacienteId: string;
  nomeCompleto: string;
  idade: string;
  genero: string;
  pesoTotal: string;
  temperatura: string;
  pressaoArterial: string;
  horaChegada: string;
}

const PatientListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [sortField, setSortField] = useState<"horaChegada" | "pesoTotal" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const { token } = getAuthData();
  let lastQueueString = "";

  const socket = useSocket();
  if (!socket) {
    throw new Error("Socket not initialized");
  }

  const handleSort = (field: "horaChegada" | "pesoTotal") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userId = payload?.sub;

  const sortedPatients: QueuePatient[] = queuePatients ? [...queuePatients].sort((a: QueuePatient, b: QueuePatient) => {
    if (!sortField) return 0;

    if (sortField === "horaChegada") {
      const [horaA, minutoA, segundoA] = a.horaChegada.split(':').map(Number);
      const [horaB, minutoB, segundoB] = b.horaChegada.split(':').map(Number);

      const totalSegundosA = horaA * 3600 + minutoA * 60 + segundoA;
      const totalSegundosB = horaB * 3600 + minutoB * 60 + segundoB;

      return sortDirection === "asc" ? totalSegundosA - totalSegundosB : totalSegundosB - totalSegundosA;
    } else {
      const pesoA = parseInt(a.pesoTotal);
      const pesoB = parseInt(b.pesoTotal);
      return sortDirection === "asc" ? pesoA - pesoB : pesoB - pesoA;
    }
  }) : [];

  useEffect(() => {
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const doctorId = payload.sub;

    const fetchPacienteData = async (userId: string) => {
      if (!token || !userId) return;
      try {
        const response = await fetch(`${API_URL}/users/find/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do paciente');
        }

        const userName = await response.json();
        setUserName(userName)
      } catch (error) {
        console.error('Erro ao buscar dados do paciente:', error);
      }
    };

    fetchPacienteData(userId)

    socket.emit("getQueue");

    socket.on("updateQueue", (queue: QueuePatient[]) => {
      console.log("📥 Fila atualizada recebida:", queue);
      
      if (queue.length === 0 && socket.recovered) {
        console.log("🔄 Ignorando fila vazia de reconexão");
        return;
      }

      const currentQueueStr = JSON.stringify(queuePatients);
      const newQueueStr = JSON.stringify(queue);
      
      if (currentQueueStr !== newQueueStr) {
        console.log("🔄 Atualizando fila com novas mudanças");
        setQueuePatients(queue);
        setLastUpdate(new Date().toLocaleString('pt-BR'));
      } else {
        console.log("🔄 Fila não mudou, ignorando atualização");
      }
    });

    socket.on("acceptPatient", (data: { medicoId: string; sala: string }) => {
      console.log("✅ Paciente aceito:", data);
    });

    socket.on("chatEnded", (data: { sala: string; pacienteId: string; medicoId: string }) => {
      console.log("❌ Chat encerrado:", data);
      setQueuePatients(prevQueue => 
        prevQueue.filter(p => p.pacienteId !== data.pacienteId)
      );
      setLastUpdate(new Date().toLocaleString('pt-BR'));
    });

    socket.on("error", (error: { message: string }) => {
      console.error("❌ Erro recebido:", error.message);
    });

    socket.on("connect", () => {
      console.log("🔌 Socket reconectado, solicitando fila atual");
      socket.emit("getQueue");
    });

    return () => {
      socket.off("updateQueue");
      socket.off("acceptPatient");
      socket.off("chatEnded");
      socket.off("error");
      socket.off("connect");
    };
  }, [token, queuePatients]);

  const handleAcceptPatient = (patientId: string) => {
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const medicoId = payload.sub;

    const chatRoom = `chat-${patientId}-${medicoId}`;

    setQueuePatients(prevQueue => 
      prevQueue.filter(p => p.pacienteId !== patientId)
    );
    setLastUpdate(new Date().toLocaleString('pt-BR'));

    socket.emit("acceptPatient", {
      pacienteId: patientId,
      medicoId: medicoId,
      sala: chatRoom
    });

    socket.emit("joinRoom", { sala: chatRoom });

    navigate("/medicalChat", {
      state: {
        sala: chatRoom,
        remetenteId: medicoId,
        mensagemInicial: "Olá! Como posso ajudar você hoje?",
        nomeCompleto: userName,
      }
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "90vh", p: 2, mt: 10 }}>
      <AppHeader />
      <Button color="primary" variant="contained" onClick={() => navigate("/manageQuestions")} sx={{ width: 200, mb: 3, ml: 1 }}>
        Criar Formulário
      </Button>

      {/* Lista de Pacientes na Fila */}
      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Pacientes na Fila</Typography>
          <Typography variant="caption" color="text.secondary">
            Última atualização: {lastUpdate}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Idade</TableCell>
                <TableCell
                  onClick={() => handleSort("horaChegada")}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  Chegada {sortField === "horaChegada" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell>Temperatura</TableCell>
                <TableCell>Pressão</TableCell>
                <TableCell>Gênero</TableCell>
                <TableCell
                  onClick={() => handleSort("pesoTotal")}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  Risco {sortField === "pesoTotal" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell>Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPatients.map((patient) => (
                <TableRow key={patient.pacienteId}>
                  <TableCell>{patient.nomeCompleto || "Paciente sem nome"}</TableCell>
                  <TableCell>{patient.idade} anos</TableCell>
                  <TableCell>{patient.horaChegada}</TableCell>
                  <TableCell>{patient.temperatura}°C</TableCell>
                  <TableCell>{patient.pressaoArterial} mmHg</TableCell>
                  <TableCell>{patient.genero}</TableCell>
                  <TableCell>{patient.pesoTotal}</TableCell>

                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleAcceptPatient(patient.pacienteId)}
                    >
                      Atender
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PatientListScreen; 