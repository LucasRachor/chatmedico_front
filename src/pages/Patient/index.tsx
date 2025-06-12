import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from "@mui/material";
import AppHeader from "../../Components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAuthData } from "../../utils/auth";
import { API_URL } from "../../config/api";

const socket = io(API_URL.replace('/api/v1', ''));

interface QueuePatient {
  pacienteId: string;
  nomeCompleto: string;
  horaChegada: string;
  idade: string;
  genero: string;
  pesoTotal: string;
  temperatura: string;
  pressaoArterial: string;
  riskRating: string;
}

interface QueueData {
  queue: QueuePatient[];
  timestamp: string;
}

const PatientListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [sortField, setSortField] = useState<"horaChegada" | "pesoTotal" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const { token } = getAuthData();

  const handleSort = (field: "horaChegada" | "pesoTotal") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const riskChipMap: Record<string, { label: string; color: string; textColor: string }> = {
    VERMELHO: { label: "Vermelho", color: '#d32f2f', textColor: '#fff' },
    AMARELO: { label: "Amarelo", color: '#fbc02d', textColor: '#000' },
    VERDE: { label: "Verde", color: '#388e3c', textColor: '#fff' },
    AZUL: { label: "Azul", color: '#1976d2', textColor: '#fff' },
  };

  const getRiskChip = (riskRating: string) => {
    return riskChipMap[riskRating] || riskChipMap["AZUL"];
  };

  const sortedPatients = [...queuePatients].sort((a, b) => {
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
  });

  const filteredPatients = sortedPatients.filter((p) => {
    let risk = p.riskRating
    switch (riskFilter) {
      case "vermelho": return risk === 'VERMELHO';
      case "amarelo": return risk === 'AMARELO';
      case "verde": return risk === 'VERDE';
      case "azul": return risk === 'AZUL';
      default: return true;
    }
  });

  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userId = payload?.sub;

  useEffect(() => {
    if (!token) return;

    const doctorId = userId;

    const fetchPacienteData = async (userId: string) => {
      if (!token || !userId) return;
      try {
        const response = await fetch(`${API_URL}/users/find/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro ao buscar dados do paciente');
        const userName = await response.json();
        setUserName(userName);
      } catch (error) {
        console.error('Erro ao buscar dados do paciente:', error);
      }
    };

    fetchPacienteData(userId);

    socket.emit("doctorConnected", { doctorId });
    socket.emit("getQueue");

    socket.on("queueList", (data: QueueData) => {
      setQueuePatients(data.queue);
      setLastUpdate(new Date(data.timestamp).toLocaleString('pt-BR'));
    });

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

    const medicoId = userId;
    const chatRoom = `chat-${patientId}-${medicoId}`;

    socket.emit("acceptPatient", {
      pacienteId: patientId,
      medicoId: medicoId,
      sala: chatRoom
    });

    setQueuePatients(prev => prev.filter(p => p.pacienteId !== patientId));

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
      <Box sx={{ display: "flex", flexDirection: "row" }}>
        <Button color="primary" variant="contained" onClick={() => navigate("/manageQuestions")} sx={{ width: 200, mb: 3, ml: 1 }}>
          Criar Formulário
        </Button>
        <Button color="primary" variant="contained" onClick={() => navigate("/medicalHistory")} sx={{ width: 200, mb: 3, ml: 1 }}>
          Atendimentos
        </Button>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6">
              Pacientes na Fila ({filteredPatients.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip label="Vermelho: Emergência" sx={{ backgroundColor: '#d32f2f', color: '#fff' }} size="small" />
              <Chip label="Amarelo: Urgente" sx={{ backgroundColor: '#fbc02d', color: '#000' }} size="small" />
              <Chip label="Verde: Pouco urgente" sx={{ backgroundColor: '#388e3c', color: '#fff' }} size="small" />
              <Chip label="Azul: Não urgente" sx={{ backgroundColor: '#1976d2', color: '#fff' }} size="small" />
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FormControl size="small">
              <InputLabel>Filtrar risco</InputLabel>
              <Select
                value={riskFilter}
                label="Filtrar risco"
                onChange={(e) => setRiskFilter(e.target.value)}
                sx={{ width: 170 }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="vermelho">Emergência</MenuItem>
                <MenuItem value="amarelo">Urgente</MenuItem>
                <MenuItem value="verde">Pouco urgente</MenuItem>
                <MenuItem value="azul">Não urgente</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary">
              Última atualização: {lastUpdate}
            </Typography>
          </Box>
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
              {filteredPatients.map((patient) => {
                const risk = getRiskChip(patient.riskRating);
                return (
                  <TableRow key={patient.pacienteId}>
                    <TableCell>{patient.nomeCompleto || "Paciente sem nome"}</TableCell>
                    <TableCell>{patient.idade} anos</TableCell>
                    <TableCell>{patient.horaChegada}</TableCell>
                    <TableCell>{patient.temperatura}°C</TableCell>
                    <TableCell>{patient.pressaoArterial} mmHg</TableCell>
                    <TableCell>{patient.genero}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${risk.label}`}
                        sx={{ backgroundColor: risk.color, color: risk.textColor }}
                        size="small"
                      />
                    </TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PatientListScreen;
