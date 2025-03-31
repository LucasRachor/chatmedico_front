import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";
import AppHeader from "../../Components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAuthData } from "../../utils/auth";

const socket = io("http://localhost:4000");

interface QueuePatient {
  pacienteId: string;
  name: string;
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

    // Solicita a fila atual
    socket.emit("getQueue");

    // Escuta atualizações da fila
    socket.on("queueList", (data: QueueData) => {
      setQueuePatients(data.queue);
      setLastUpdate(new Date(data.timestamp).toLocaleString('pt-BR'));
    });

    // Escuta quando um paciente é removido da fila
    socket.on("patientRemovedFromQueue", (patientId: string) => {
      setQueuePatients(prev => prev.filter(p => p.pacienteId !== patientId));
    });

    return () => {
      socket.off("queueList");
      socket.off("patientRemovedFromQueue");
    };
  }, [token]);

  const handleAcceptPatient = (patientId: string) => {
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const medicoId = payload.sub;

    socket.emit("acceptPatient", {
      data: {
        pacienteId: patientId,
        medicoId: medicoId
      }
    });

    // Remove o paciente da fila
    setQueuePatients(prev => prev.filter(p => p.pacienteId !== patientId));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "90vh", p: 2, mt: 10 }}>
      <AppHeader />
      <Button color="primary" variant="contained" onClick={() => navigate("/manageQuestions")} sx={{width: 200, mb: 3, ml: 1}}>
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
                <TableCell>Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queuePatients.map((patient) => (
                <TableRow key={patient.pacienteId}>
                  <TableCell>{patient.name || "Paciente sem nome"}</TableCell>
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