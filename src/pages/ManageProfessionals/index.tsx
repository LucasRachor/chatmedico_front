import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  SelectChangeEvent
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Add, Edit, Delete } from '@mui/icons-material';
import axios from 'axios';
import { getAuthData } from '../../utils/auth';
import { API_URL } from "../../config/api";
import AppHeader from "../../Components/AppHeader/AppHeader";

interface Professional {
  id: string;
  username: string;
  nomeCompleto: string;
  email: string;
  CRM: string;
  coren: string | null;
  role: string;
}

interface Endereco {
  rua: string;
  numero: number;
  bairro: string;
  cidade: string;
  cep: string;
}

interface Paciente {
  id: string;
  nomeCompleto: string;
  cpf: string;
  email: string;
  dataNascimento: string;
  grauDeInstrucao: string;
  username: string;
  idade: number;
  genero: string;
  telefone: string;
  endereco: Endereco[];
}

const ManageProfessionals: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [openRows, setOpenRows] = useState<{ [key: string]: boolean }>({});
  const [openModal, setOpenModal] = useState(false);
  const [openModalPaciente, setOpenModalPaciente] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const { token } = getAuthData();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nomeCompleto: '',
    email: '',
    tipo: '',
    CRM: '',
    coren: ''
  });
  const [formDataPaciente, setFormDataPaciente] = useState({
    username: '',
    password: '',
    nomeCompleto: '',
    email: '',
    cpf: '',
    dataNascimento: '',
    grauDeInstrucao: '',
    genero: '',
    telefone: '',
    endereco: {
      rua: '',
      numero: 0,
      bairro: '',
      cidade: '',
      cep: ''
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profissionais' | 'pacientes'>('profissionais');

  useEffect(() => {
    fetchProfessionals();
    fetchPacientes();
  }, []);

  const fetchProfessionals = async () => {
    try {
      const response = await axios.get(`${API_URL}/equipe-medica/medicos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setProfessionals(response.data);
    } catch (err) {
      setError('Erro ao carregar profissionais');
    }
  };

  const fetchPacientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/pacientes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPacientes(response.data);
    } catch (err) {
      setError('Erro ao carregar pacientes');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleInputChangePaciente = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name.startsWith('endereco.')) {
      const enderecoField = name.split('.')[1];
      setFormDataPaciente(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [enderecoField]: value
        }
      }));
    } else {
      setFormDataPaciente(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const formatCoren = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    // Limita a 6 dígitos
    const limitedNumbers = numbers.slice(0, 6);

    if (limitedNumbers.length <= 3) {
      return `COREN-AM ${limitedNumbers}`;
    } else {
      return `COREN-AM ${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}-ENF`;
    }
  };

  const formatCRM = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    // Limita a 4 dígitos
    const limitedNumbers = numbers.slice(0, 4);

    return `CRM-AM ${limitedNumbers}`;
  };

  const handleCorenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatCoren(value);
    setFormData(prev => ({
      ...prev,
      coren: formattedValue
    }));
  };

  const handleCRMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatCRM(value);
    setFormData(prev => ({
      ...prev,
      CRM: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { tipo, ...data } = formData;
      const processedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
      );

      const url = formData.tipo === 'medico'
        ? `${API_URL}/equipe-medica/medico`
        : `${API_URL}/equipe-medica/enfermeiro`;

      await axios.post(url, processedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('Profissional cadastrado com sucesso!');
      setFormData({
        username: '',
        password: '',
        nomeCompleto: '',
        email: '',
        tipo: 'medico',
        CRM: '',
        coren: ''
      });
      setOpenModal(false);
      fetchProfessionals();
    } catch (err) {
      setError('Erro ao cadastrar profissional');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/equipe-medica/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Profissional removido com sucesso!');
      fetchProfessionals();
    } catch (err) {
      setError('Erro ao remover profissional');
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData({
      username: professional.username,
      password: '',
      nomeCompleto: professional.nomeCompleto,
      email: professional.email,
      tipo: professional.role === 'medico' ? 'medico' : 'enfermeiro',
      CRM: professional.CRM,
      coren: professional.coren || ''
    });
    setOpenModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfessional) return;

    try {
      const { tipo, ...data } = formData;
      const processedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
      );

      await axios.patch(`${API_URL}/equipe-medica/${editingProfessional.id}`, processedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Profissional atualizado com sucesso!');
      setOpenModal(false);
      setEditingProfessional(null);
      fetchProfessionals();
    } catch (err) {
      setError('Erro ao atualizar profissional');
    }
  };

  const handleEditPaciente = (paciente: Paciente) => {
    setEditingPaciente(paciente);
    setFormDataPaciente({
      username: paciente.username,
      password: '',
      nomeCompleto: paciente.nomeCompleto,
      email: paciente.email,
      cpf: paciente.cpf,
      dataNascimento: paciente.dataNascimento.split('T')[0],
      grauDeInstrucao: paciente.grauDeInstrucao,
      genero: paciente.genero,
      telefone: paciente.telefone,
      endereco: paciente.endereco[0] || {
        rua: '',
        numero: 0,
        bairro: '',
        cidade: '',
        cep: ''
      }
    });
    setOpenModalPaciente(true);
  };

  const handleUpdatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaciente) return;

    try {
      const { username, password, email, telefone, grauDeInstrucao } = formDataPaciente;
      const processedData: Record<string, string> = {};

      if (username) processedData.username = username;
      if (password) processedData.password = password;
      if (email) processedData.email = email;
      if (telefone) processedData.telefone = telefone;
      if (grauDeInstrucao) processedData.grauDeInstrucao = grauDeInstrucao;

      await axios.patch(`${API_URL}/pacientes/${editingPaciente.id}`, processedData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Paciente atualizado com sucesso!');
      setOpenModalPaciente(false);
      setEditingPaciente(null);
      fetchPacientes();
    } catch (err) {
      setError('Erro ao atualizar paciente');
    }
  };

  const handleDeletePaciente = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/pacientes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSuccess('Paciente removido com sucesso!');
      fetchPacientes();
    } catch (err) {
      setError('Erro ao remover paciente');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <AppHeader />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 15 }}>
        <Typography variant="h4" component="h1">
          Gerenciamento
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={activeTab === 'profissionais' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('profissionais')}
          >
            Profissionais
          </Button>
          <Button
            variant={activeTab === 'pacientes' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('pacientes')}
          >
            Pacientes
          </Button>
        </Box>
      </Box>

      {activeTab === 'profissionais' ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingProfessional(null);
                setFormData({
                  username: '',
                  password: '',
                  nomeCompleto: '',
                  email: '',
                  tipo: 'medico',
                  CRM: '',
                  coren: ''
                });
                setOpenModal(true);
              }}
            >
              Novo Profissional
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Registro</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {professionals.map((professional) => (
                  <React.Fragment key={professional.id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setOpenRows(prev => ({
                            ...prev,
                            [professional.id]: !prev[professional.id]
                          }))}
                        >
                          {openRows[professional.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{professional.nomeCompleto}</TableCell>
                      <TableCell>{professional.email}</TableCell>
                      <TableCell>
                        {professional.role === 'medico' ? 'Médico' : 'Enfermeiro'}
                      </TableCell>
                      <TableCell>
                        {professional.role === 'medico' ? professional.CRM : professional.coren}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEdit(professional)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(professional.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={openRows[professional.id]} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Detalhes
                            </Typography>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell>Nome de Usuário:</TableCell>
                                  <TableCell>{professional.username}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Email:</TableCell>
                                  <TableCell>{professional.email}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Registro Profissional:</TableCell>
                                  <TableCell>
                                    {professional.role === 'medico' ? `${professional.CRM}` : `${professional.coren}`}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>CPF</TableCell>
                  <TableCell>Idade</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pacientes.map((paciente) => (
                  <React.Fragment key={paciente.id}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => setOpenRows(prev => ({
                            ...prev,
                            [paciente.id]: !prev[paciente.id]
                          }))}
                        >
                          {openRows[paciente.id] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{paciente.nomeCompleto}</TableCell>
                      <TableCell>{paciente.email}</TableCell>
                      <TableCell>{paciente.cpf}</TableCell>
                      <TableCell>{paciente.idade}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditPaciente(paciente)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDeletePaciente(paciente.id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                        <Collapse in={openRows[paciente.id]} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                              Detalhes
                            </Typography>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell>Nome de Usuário:</TableCell>
                                  <TableCell>{paciente.username}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Email:</TableCell>
                                  <TableCell>{paciente.email}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>CPF:</TableCell>
                                  <TableCell>{paciente.cpf}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Data de Nascimento:</TableCell>
                                  <TableCell>{new Date(paciente.dataNascimento).toLocaleDateString()}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Grau de Instrução:</TableCell>
                                  <TableCell>{paciente.grauDeInstrucao}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Gênero:</TableCell>
                                  <TableCell>{paciente.genero}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Telefone:</TableCell>
                                  <TableCell>{paciente.telefone}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Endereço:</TableCell>
                                  <TableCell>
                                    {paciente.endereco[0] && (
                                      `${paciente.endereco[0].rua}, ${paciente.endereco[0].numero} - ${paciente.endereco[0].bairro}, ${paciente.endereco[0].cidade} - CEP: ${paciente.endereco[0].cep}`
                                    )}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={editingProfessional ? handleUpdate : handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                label="Tipo"
                required
              >
                <MenuItem value="medico">Médico</MenuItem>
                <MenuItem value="enfermeiro">Enfermeiro</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Nome de Usuário"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Senha"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Nome Completo"
              name="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />

            {formData.tipo === 'medico' ? (
              <TextField
                fullWidth
                label="CRM"
                name="CRM"
                value={formData.CRM}
                onChange={handleCRMChange}
                required
                sx={{ mb: 2 }}
                placeholder="Digite apenas os números"
              />
            ) : (
              <TextField
                fullWidth
                label="COREN"
                name="coren"
                value={formData.coren}
                onChange={handleCorenChange}
                required
                sx={{ mb: 2 }}
                placeholder="Digite apenas os números"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={editingProfessional ? handleUpdate : handleSubmit}
            type="submit"
          >
            {editingProfessional ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openModalPaciente} onClose={() => setOpenModalPaciente(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Editar Paciente
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleUpdatePaciente} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nome de Usuário"
              name="username"
              value={formDataPaciente.username}
              onChange={handleInputChangePaciente}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Nova Senha"
              name="password"
              type="password"
              value={formDataPaciente.password}
              onChange={handleInputChangePaciente}
              sx={{ mb: 2 }}
              helperText="Deixe em branco para manter a senha atual"
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formDataPaciente.email}
              onChange={handleInputChangePaciente}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Telefone"
              name="telefone"
              value={formDataPaciente.telefone}
              onChange={handleInputChangePaciente}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Grau de Instrução"
              name="grauDeInstrucao"
              value={formDataPaciente.grauDeInstrucao}
              onChange={handleInputChangePaciente}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModalPaciente(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUpdatePaciente}
            type="submit"
          >
            Atualizar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError('');
          setSuccess('');
        }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          onClose={() => {
            setError('');
            setSuccess('');
          }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManageProfessionals; 