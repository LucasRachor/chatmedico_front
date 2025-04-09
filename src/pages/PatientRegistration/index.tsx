import React, { useState } from 'react';
import fundoLogin from "../../assets/fundo-login.jpg";
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Alert,
    Snackbar
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ptBR from "date-fns/locale/pt-BR"
import { format } from 'date-fns';
import { API_URL } from "../../config/api";

interface EnderecoForm {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

interface PatientForm {
    cpf: string;
    username: string;
    password: string;
    nomeCompleto: string;
    telefone: string;
    email: string;
    genero: string;
    grauDeInstrucao: string;
    dataNascimento: Date | null;
    idade: number;
    endereco: EnderecoForm;
}

const PatientRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const { control, handleSubmit, formState: { errors }, setValue } = useForm<PatientForm>({
        defaultValues: {
            endereco: {
                rua: '',
                numero: '',
                bairro: '',
                cidade: '',
                estado: '',
                cep: ''
            }
        }
    });

    const handleCEPBlur = async (cep: string) => {
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setValue('endereco.rua', data.logradouro);
                    setValue('endereco.bairro', data.bairro);
                    setValue('endereco.cidade', data.localidade);
                    setValue('endereco.estado', data.uf);
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            }
        }
    };

    const onSubmit = async (data: PatientForm) => {
        try {
            const formattedData = {
                ...data,
                dataNascimento: data.dataNascimento ? format(data.dataNascimento, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null,
                endereco: {
                    ...data.endereco,
                    numero: parseInt(data.endereco.numero)
                }
            };

            const response = await fetch(`${API_URL}/pacientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData),
            });

            if (response.ok) {
                setSnackbarMessage('Paciente cadastrado com sucesso!');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                setTimeout(() => navigate('/'), 2000);
            } else {
                const errorData = await response.json();
                if (errorData.error) {
                    // Cria uma mensagem com todos os erros de campos duplicados
                    const errorMessages = Object.values(errorData.error).join('\n');
                    setSnackbarMessage(errorMessages);
                    setSnackbarSeverity('error');
                    setOpenSnackbar(true);
                } else {
                    throw new Error('Erro ao cadastrar paciente');
                }
            }
        } catch (error) {
            setSnackbarMessage('Erro ao cadastrar paciente. Tente novamente.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundImage: `url(${fundoLogin})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4
            }}
        >
            <Container maxWidth="md">
                <Box sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2,
                    p: 4,
                    boxShadow: 3
                }}>
                    <Typography variant="h4" gutterBottom align="center">
                        Cadastro de Paciente
                    </Typography>
                    <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={3}>

                                {/* Dados de Acesso */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Dados de Acesso
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="username"
                                        control={control}
                                        rules={{ required: 'Nome de usuário é obrigatório' }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Nome de Usuário"
                                                fullWidth
                                                error={!!errors.username}
                                                helperText={errors.username?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="password"
                                        control={control}
                                        rules={{
                                            required: 'Senha é obrigatória',
                                            minLength: {
                                                value: 6,
                                                message: 'A senha deve ter no mínimo 6 caracteres'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                type="password"
                                                label="Senha"
                                                fullWidth
                                                error={!!errors.password}
                                                helperText={errors.password?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                {/* Dados Pessoais */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom>
                                        Dados Pessoais
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="nomeCompleto"
                                        control={control}
                                        rules={{ required: 'Nome completo é obrigatório' }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Nome Completo"
                                                fullWidth
                                                error={!!errors.nomeCompleto}
                                                helperText={errors.nomeCompleto?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="cpf"
                                        control={control}
                                        rules={{
                                            required: 'CPF é obrigatório',
                                            pattern: {
                                                value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                                                message: 'CPF inválido'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="CPF"
                                                fullWidth
                                                error={!!errors.cpf}
                                                helperText={errors.cpf?.message}
                                                placeholder="000.000.000-00"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="email"
                                        control={control}
                                        rules={{
                                            required: 'Email é obrigatório',
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: 'Email inválido'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Email"
                                                fullWidth
                                                error={!!errors.email}
                                                helperText={errors.email?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="telefone"
                                        control={control}
                                        rules={{
                                            required: 'Telefone é obrigatório',
                                            pattern: {
                                                value: /^\(\d{2}\) \d{5}-\d{4}$/,
                                                message: 'Telefone inválido'
                                            }
                                        }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Telefone"
                                                fullWidth
                                                error={!!errors.telefone}
                                                helperText={errors.telefone?.message}
                                                placeholder="(00) 00000-0000"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="genero"
                                        control={control}
                                        rules={{ required: 'Gênero é obrigatório' }}
                                        render={({ field }) => (
                                            <FormControl fullWidth error={!!errors.genero}>
                                                <InputLabel>Gênero</InputLabel>
                                                <Select {...field} label="Gênero">
                                                    <MenuItem value="Masculino">Masculino</MenuItem>
                                                    <MenuItem value="Feminino">Feminino</MenuItem>
                                                    <MenuItem value="Outro">Outro</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="grauDeInstrucao"
                                        control={control}
                                        rules={{ required: 'Grau de instrução é obrigatório' }}
                                        render={({ field }) => (
                                            <FormControl fullWidth error={!!errors.grauDeInstrucao}>
                                                <InputLabel>Grau de Instrução</InputLabel>
                                                <Select {...field} label="Grau de Instrução">
                                                    <MenuItem value="Fundamental Incompleto">Fundamental Incompleto</MenuItem>
                                                    <MenuItem value="Fundamental Completo">Fundamental Completo</MenuItem>
                                                    <MenuItem value="Médio Incompleto">Médio Incompleto</MenuItem>
                                                    <MenuItem value="Médio Completo">Médio Completo</MenuItem>
                                                    <MenuItem value="Superior Incompleto">Superior Incompleto</MenuItem>
                                                    <MenuItem value="Superior Completo">Superior Completo</MenuItem>
                                                    <MenuItem value="Pós-graduação">Pós-graduação</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                                        <Controller
                                            name="dataNascimento"
                                            control={control}
                                            rules={{ required: 'Data de nascimento é obrigatória' }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    label="Data de Nascimento"
                                                    value={field.value}
                                                    onChange={(newValue) => {
                                                        field.onChange(newValue);
                                                        if (newValue) {
                                                            const hoje = new Date();
                                                            const idade = hoje.getFullYear() - newValue.getFullYear();
                                                            setValue('idade', idade);
                                                        }
                                                    }}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.dataNascimento,
                                                            helperText: errors.dataNascimento?.message
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="idade"
                                        control={control}
                                        render={({ field }) => (
                                            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                                                <Typography variant="body1">
                                                    Idade: {field.value || ''} anos
                                                </Typography>
                                            </Box>
                                        )}
                                    />
                                </Grid>

                                {/* Endereço */}
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Endereço
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Controller
                                        name="endereco.cep"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="CEP"
                                                fullWidth
                                                error={!!errors.endereco?.cep}
                                                helperText={errors.endereco?.cep?.message}
                                                placeholder="00000-000"
                                                onBlur={(e) => {
                                                    field.onBlur();
                                                    handleCEPBlur(e.target.value.replace(/\D/g, ''));
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="endereco.rua"
                                        control={control}
                                        rules={{ required: 'Rua é obrigatória' }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Rua"
                                                fullWidth
                                                error={!!errors.endereco?.rua}
                                                helperText={errors.endereco?.rua?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={2}>
                                    <Controller
                                        name="endereco.numero"
                                        control={control}
                                        rules={{ required: 'Número é obrigatório' }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Número"
                                                fullWidth
                                                error={!!errors.endereco?.numero}
                                                helperText={errors.endereco?.numero?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Controller
                                        name="endereco.bairro"
                                        control={control}
                                        rules={{ required: 'Bairro é obrigatório' }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Bairro"
                                                fullWidth
                                                error={!!errors.endereco?.bairro}
                                                helperText={errors.endereco?.bairro?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Controller
                                        name="endereco.cidade"
                                        control={control}
                                        rules={{ required: 'Cidade é obrigatória' }}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Cidade"
                                                fullWidth
                                                error={!!errors.endereco?.cidade}
                                                helperText={errors.endereco?.cidade?.message}
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Controller
                                        name="endereco.estado"
                                        control={control}
                                        rules={{ required: 'Estado é obrigatório' }}
                                        render={({ field }) => (
                                            <FormControl fullWidth error={!!errors.endereco?.estado}>
                                                <InputLabel>Estado</InputLabel>
                                                <Select {...field} label="Estado">
                                                    <MenuItem value="AC">Acre</MenuItem>
                                                    <MenuItem value="AL">Alagoas</MenuItem>
                                                    <MenuItem value="AP">Amapá</MenuItem>
                                                    <MenuItem value="AM">Amazonas</MenuItem>
                                                    <MenuItem value="BA">Bahia</MenuItem>
                                                    <MenuItem value="CE">Ceará</MenuItem>
                                                    <MenuItem value="DF">Distrito Federal</MenuItem>
                                                    <MenuItem value="ES">Espírito Santo</MenuItem>
                                                    <MenuItem value="GO">Goiás</MenuItem>
                                                    <MenuItem value="MA">Maranhão</MenuItem>
                                                    <MenuItem value="MT">Mato Grosso</MenuItem>
                                                    <MenuItem value="MS">Mato Grosso do Sul</MenuItem>
                                                    <MenuItem value="MG">Minas Gerais</MenuItem>
                                                    <MenuItem value="PA">Pará</MenuItem>
                                                    <MenuItem value="PB">Paraíba</MenuItem>
                                                    <MenuItem value="PR">Paraná</MenuItem>
                                                    <MenuItem value="PE">Pernambuco</MenuItem>
                                                    <MenuItem value="PI">Piauí</MenuItem>
                                                    <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                                                    <MenuItem value="RN">Rio Grande do Norte</MenuItem>
                                                    <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                                                    <MenuItem value="RO">Rondônia</MenuItem>
                                                    <MenuItem value="RR">Roraima</MenuItem>
                                                    <MenuItem value="SC">Santa Catarina</MenuItem>
                                                    <MenuItem value="SP">São Paulo</MenuItem>
                                                    <MenuItem value="SE">Sergipe</MenuItem>
                                                    <MenuItem value="TO">Tocantins</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => navigate('/')}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                        >
                                            Cadastrar
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>
                </Box>
            </Container>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    sx={{ width: '100%', whiteSpace: 'pre-line' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PatientRegistration; 