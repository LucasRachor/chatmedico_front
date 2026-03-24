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
  FormControl,
  CircularProgress,
  Alert,
  Snackbar
} from "@mui/material";
import AppHeader from "../../Components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { getAuthData } from "../../utils/auth";
import api, { API_URL } from "../../config/api";

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

const riskChipMap: Record<string, { label: string; color: string; textColor: string }> = {
  VERMELHO: { label: "Vermelho", color: '#d32f2f', textColor: '#fff' },
  AMARELO: { label: "Amarelo", color: '#fbc02d', textColor: '#000' },
  VERDE: { label: "Verde", color: '#388e3c', textColor: '#fff' },
  AZUL: { label: "Azul", color: '#1976d2', textColor: '#fff' },
};

const PatientListScreen: React.FC = () => {
  const navigate = useNavigate();
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [sortField, setSortField] = useState<"horaChegada" | "pesoTotal" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({ open: false, message: "", severity: "info" });
  const { token } = getAuthData();

  const payload = useMemo(() => token ? JSON.parse(atob(token.split('.')[1])) : null, [token]);
  const userId = payload?.sub;

  const handleSort = (field: "horaChegada" | "pesoTotal") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getRiskChip = (riskRating: string) => {
    return riskChipMap[riskRating] || riskChipMap["AZUL"];
  };

  const filteredPatients = useMemo(() => {
    const sorted = [...queuePatients].sort((a, b) => {
      if (!sortField) return 0;
      if (sortField === "horaChegada") {
        const [horaA, minutoA, segundoA] = a.horaChegada.split(':').map(Number);
        const [horaB, minutoB, segundoB] = b.horaChegada.split(':').map(Number);
        const totalA = horaA * 3600 + minutoA * 60 + segundoA;
        const totalB = horaB * 3600 + minutoB * 60 + segundoB;
        return sortDirection === "asc" ? totalA - totalB : totalB - totalA;
      } else {
        const pesoA = parseInt(a.pesoTotal);
        const pesoB = parseInt(b.pesoTotal);
        return sortDirection === "asc" ? pesoA - pesoB : pesoB - pesoA;
      }
    });

    return sorted.filter((p) => {
      switch (riskFilter) {
        case "vermelho": return p.riskRating === 'VERMELHO';
        case "amarelo": return p.riskRating === 'AMARELO';
        case "verde": return p.riskRating === 'VERDE';
        case "azul": return p.riskRating === 'AZUL';
        default: return true;
      }
    });
  }, [queuePatients, sortField, sortDirection, riskFilter]);

  useEffect(() => {
    if (!token || !userId) {
      navigate("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const { data } = await api.get(`/users/find/${userId}`);
        setUserName(typeof data === "string" ? data : data.nomeCompleto);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };

    fetchUserData();

    socket.emit("doctorConnected", { doctorId: userId });
    socket.emit("getQueue");

    socket.on("queueList", (data: QueueData) => {
      setQueuePatients(data.queue);
      setLastUpdate(new Date(data.timestamp).toLocaleString('pt-BR'));
      setLoading(false);
    });

    socket.on("updateQueue", (queue: QueuePatient[]) => {
      setQueuePatients(queue);
      setLastUpdate(new Date().toLocaleString('pt-BR'));
    });

    return () => {
      socket.off("queueList");
      socket.off("updateQueue");
    };
  }, [token, userId, navigate]);

  const handleAcceptPatient = (patientId: string) => {
    if (!token || !userId) return;

    const chatRoom = `chat-${patientId}-${userId}`;

    socket.emit("acceptPatient", {
      pacienteId: patientId,
      medicoId: userId,
      sala: chatRoom,
      nomeCompletoMedico: userName,
      roleMedico: payload?.role,
    });

    setQueuePatients(prev => prev.filter(p => p.pacienteId !== patientId));
    setSnackbar({ open: true, message: "Iniciando atendimento...", severity: "info" });

    navigate("/medicalChat", {
      state: {
        sala: chatRoom,
        remetenteId: userId,
        mensagemInicial: "Olá! Como posso ajudar você hoje?",
        nomeCompleto: userName,
      }
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "90vh", mt: { xs: 7, sm: 10 } }}>
        <AppHeader />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "90vh", p: { xs: 1, sm: 2 }, mt: { xs: 7, sm: 10 } }}>
      <AppHeader />
      <Box sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
        <Button color="primary" variant="contained" onClick={() => navigate("/manageQuestions")} sx={{ mb: { xs: 1, sm: 3 } }}>
          Criar Formulário
        </Button>
        <Button color="primary" variant="contained" onClick={() => navigate("/medicalHistory")} sx={{ mb: { xs: 1, sm: 3 } }}>
          Atendimentos
        </Button>
      </Box>

      <Paper sx={{ p: { xs: 1.5, sm: 3 }, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2, gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Pacientes na Fila ({filteredPatients.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
              <Chip label="Vermelho: Emergência" sx={{ backgroundColor: '#d32f2f', color: '#fff' }} size="small" />
              <Chip label="Amarelo: Urgente" sx={{ backgroundColor: '#fbc02d', color: '#000' }} size="small" />
              <Chip label="Verde: Pouco urgente" sx={{ backgroundColor: '#388e3c', color: '#fff' }} size="small" />
              <Chip label="Azul: Não urgente" sx={{ backgroundColor: '#1976d2', color: '#fff' }} size="small" />
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <FormControl size="small">
              <InputLabel>Filtrar risco</InputLabel>
              <Select
                value={riskFilter}
                label="Filtrar risco"
                onChange={(e) => setRiskFilter(e.target.value)}
                sx={{ width: { xs: 140, sm: 170 } }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="vermelho">Emergência</MenuItem>
                <MenuItem value="amarelo">Urgente</MenuItem>
                <MenuItem value="verde">Pouco urgente</MenuItem>
                <MenuItem value="azul">Não urgente</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Última atualização: {lastUpdate}
            </Typography>
          </Box>
        </Box>

        {filteredPatients.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum paciente na fila
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Novos pacientes aparecerão aqui automaticamente.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Idade</TableCell>
                  <TableCell
                    onClick={() => handleSort("horaChegada")}
                    sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                  >
                    Chegada {sortField === "horaChegada" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableCell>
                  <TableCell>Temperatura</TableCell>
                  <TableCell>Pressão</TableCell>
                  <TableCell>Gênero</TableCell>
                  <TableCell
                    onClick={() => handleSort("pesoTotal")}
                    sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
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
                    <TableRow key={patient.pacienteId} hover>
                      <TableCell>{patient.nomeCompleto || "Paciente sem nome"}</TableCell>
                      <TableCell>{patient.idade} anos</TableCell>
                      <TableCell>{patient.horaChegada}</TableCell>
                      <TableCell>{patient.temperatura}°C</TableCell>
                      <TableCell>{patient.pressaoArterial} mmHg</TableCell>
                      <TableCell>{patient.genero}</TableCell>
                      <TableCell>
                        <Chip
                          label={risk.label}
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
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientListScreen;
