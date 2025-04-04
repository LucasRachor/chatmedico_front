import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";
import AppHeader from "../../Components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAuthData } from "../../utils/auth";

const socket = io("http://localhost:4000");

interface QueuePatient {
  pacienteId: string;
  nome_completo: string;
  horaChegada: string;
  idade: string;
  genero: string;
  pesoTotal: string
}

interface QueueData {
  queue: QueuePatient[];
  timestamp: string;
}

const PatientListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const { token } = getAuthData();

  useEffect(() => {
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const doctorId = payload.sub;

    // Notifica o servidor que um médico conectou
    socket.emit("doctorConnected", { doctorId });

    // Solicita a fila atual
    socket.emit("getQueue");

    // Escuta atualizações da fila
    socket.on("queueList", (data: QueueData) => {
      setQueuePatients(data.queue);
      setLastUpdate(new Date(data.timestamp).toLocaleString('pt-BR'));
    });

    // Escuta atualizações gerais da fila (quando pacientes entram ou saem)
    socket.on("updateQueue", (queue: QueuePatient[]) => {
      setQueuePatients(queue);
      setLastUpdate(new Date().toLocaleString('pt-BR'));
    });

    return () => {
      socket.off("queueList");
      socket.off("updateQueue");
    };
  }, [token]);

  const handleAcceptPatient = (patientId: string) => {
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const medicoId = payload.sub;

    // Cria a sala do chat
    const chatRoom = `chat-${patientId}-${medicoId}`;

    // Emite o evento de aceitar paciente
    socket.emit("acceptPatient", {
      pacienteId: patientId,
      medicoId: medicoId,
      sala: chatRoom
    });

    // Remove o paciente da fila
    setQueuePatients(prev => prev.filter(p => p.pacienteId !== patientId));

    // Redireciona para o chat com os parâmetros necessários
    navigate("/medicalChat", {
      state: {
        sala: chatRoom,
        remetenteId: medicoId,
        mensagemInicial: "Olá! Como posso ajudar você hoje?"
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
                <TableCell>Chegada</TableCell>
                <TableCell>Idade</TableCell>
                <TableCell>Gênero</TableCell>
                <TableCell>Risco</TableCell>
                <TableCell>Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queuePatients.map((patient) => (
                <TableRow key={patient.pacienteId}>
                  <TableCell>{patient.nome_completo || "Paciente sem nome"}</TableCell>
                  <TableCell>{patient.horaChegada || "Paciente sem chegada"}</TableCell>
                  <TableCell>{patient.idade}</TableCell>
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