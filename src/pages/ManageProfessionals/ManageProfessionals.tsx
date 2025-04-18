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

const ManageProfessionals: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [openRows, setOpenRows] = useState<{ [key: string]: boolean }>({});
  const [openModal, setOpenModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfessionals();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <AppHeader/>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 15 }}>
        <Typography variant="h4" component="h1">
          Gerenciamento Equipe Médica
        </Typography>
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
                            <TableRow>
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

            {!editingProfessional && (
              <TextField
                fullWidth
                label="Senha"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                sx={{ mb: 2 }}
              />
            )}

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