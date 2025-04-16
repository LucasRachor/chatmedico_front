import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Collapse,
    Chip,
    Alert,
    Snackbar
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import axios from 'axios';
import { getAuthData } from '../../utils/auth';
import { API_URL } from '../../config/api';
import AppHeader from '../../Components/AppHeader/AppHeader';

interface Resposta {
    pergunta: string;
    resposta: string;
}

interface Atendimento {
    dataAtendimento: string;
    pressaoArterial: string;
    temperatura: string;
    tipoAtendimento: string;
    respostas: Resposta[];
}

const PatientHistory: React.FC = () => {
    const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
    const [openRows, setOpenRows] = useState<{ [key: number]: boolean }>({});
    const [error, setError] = useState('');
    const { token } = getAuthData();

    useEffect(() => {
        fetchAtendimentos();
    }, []);

    const fetchAtendimentos = async () => {
        try {
            const response = await axios.get(`${API_URL}/atendimentos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setAtendimentos(response.data);
        } catch (err) {
            setError('Erro ao carregar histórico de atendimentos');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <AppHeader />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Histórico de Atendimentos
                </Typography>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Data e Hora</TableCell>
                            <TableCell>Pressão Arterial</TableCell>
                            <TableCell>Temperatura</TableCell>
                            <TableCell>Tipo de Atendimento</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {atendimentos.map((atendimento, index) => (
                            <React.Fragment key={index}>
                                <TableRow>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => setOpenRows(prev => ({
                                                ...prev,
                                                [index]: !prev[index]
                                            }))}
                                        >
                                            {openRows[index] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>{formatDate(atendimento.dataAtendimento)}</TableCell>
                                    <TableCell>{atendimento.pressaoArterial}</TableCell>
                                    <TableCell>{atendimento.temperatura}°C</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={atendimento.tipoAtendimento}
                                            color={atendimento.tipoAtendimento === 'IA' ? 'primary' : 'secondary'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                        <Collapse in={openRows[index]} timeout="auto" unmountOnExit>
                                            <Box sx={{ margin: 1 }}>
                                                <Typography variant="h6" gutterBottom component="div">
                                                    Detalhes do Atendimento
                                                </Typography>
                                                {atendimento.respostas.length > 0 ? (
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Pergunta</TableCell>
                                                                <TableCell>Resposta</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {atendimento.respostas.map((resposta, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>{resposta.pergunta}</TableCell>
                                                                    <TableCell>{resposta.resposta}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Nenhuma pergunta respondida neste atendimento.
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert
                    severity="error"
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default PatientHistory; 