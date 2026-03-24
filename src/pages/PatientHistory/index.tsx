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
    Snackbar,
    Button,
    CircularProgress
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import api from '../../config/api';
import AppHeader from '../../Components/AppHeader/AppHeader';
import { useNavigate } from "react-router-dom";

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
    cidade: string;
    classificacaoRisco: string;
}

const PatientHistory: React.FC = () => {
    const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
    const [openRows, setOpenRows] = useState<{ [key: number]: boolean }>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchAtendimentos = async () => {
        try {
            const response = await api.get('/atendimentos');
            setAtendimentos(response.data);
        } catch (err) {
            setError('Erro ao carregar histórico de atendimentos');
        } finally {
            setLoading(false);
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

    const getClassificationColor = (classification: string) => {
        switch (classification.toLowerCase()) {
            case 'vermelho':
                return 'error';
            case 'amarelo':
                return 'warning';
            case 'verde':
                return 'success';
            case 'azul':
                return 'primary';
            default:
                return 'default';
        }
    };

    const voltar = async () => {
        navigate('/PatientHome')
    }

    useEffect(() => {
        fetchAtendimentos();
    }, []);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: { xs: 8, sm: 12 }, mb: 4 }}>
                <AppHeader />
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: { xs: 8, sm: 12 }, mb: 4, px: { xs: 1, sm: 3 } }}>
            <AppHeader />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.3rem', sm: '2.125rem' } }}>
                    Meus Atendimentos:
                </Typography>
            </Box>

            <Button
                variant="contained"
                color="primary"
                onClick={voltar}
                style={{ marginBottom: '16px' }}
            >
                Voltar
            </Button>

            <TableContainer component={Paper} sx={{ maxHeight: '500px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Data e Hora</TableCell>
                            <TableCell>Pressão Arterial</TableCell>
                            <TableCell>Temperatura</TableCell>
                            <TableCell>Município</TableCell>
                            <TableCell>Classificação</TableCell>
                            <TableCell>Tipo de Atendimento</TableCell>
                            <TableCell />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {atendimentos.map((atendimento, index) => (
                            <React.Fragment key={index}>
                                <TableRow>
                                    <TableCell>{formatDate(atendimento.dataAtendimento)}</TableCell>
                                    <TableCell>{atendimento.pressaoArterial}</TableCell>
                                    <TableCell>{atendimento.temperatura}°C</TableCell>
                                    <TableCell>{atendimento.cidade}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={atendimento.classificacaoRisco}
                                            color={getClassificationColor(atendimento.classificacaoRisco)}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={atendimento.tipoAtendimento.toUpperCase()}
                                            color={atendimento.tipoAtendimento === 'IA' ? 'primary' : 'secondary'}
                                            variant="outlined"
                                        />
                                    </TableCell>
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
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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