import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  TextField
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getAuthData } from "../../utils/auth";
import { API_URL } from "../../config/api";
import AppHeader from "../../Components/AppHeader/AppHeader";

interface Alternativa {
  alternativa: string;
  peso: number;
}

interface Pergunta {
  pergunta: string;
  observacao?: string;
  alternativas: Alternativa[];
}

interface FormData {
  [key: string]: string;
  temperatura: string;
  pressaoArterial: string;
}

const HealthRiskForm: React.FC = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      temperatura: '',
      pressaoArterial: ''
    }
  });
  const navigate = useNavigate();
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = getAuthData();

  useEffect(() => {
    const fetchPerguntas = async () => {
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/questionario`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Erro ao carregar perguntas');
        }

        const data = await response.json();
        setPerguntas(data);
      } catch (error) {
        setError('Erro ao carregar o formulário. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerguntas();
  }, [token, navigate]);

  const onSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    try {
      const pesoTotal = Object.entries(formData)
        .filter(([key]) => key.startsWith('pergunta_'))
        .reduce((total, [_, valor]) => {
          const peso = parseInt(valor.split('_')[2] || '0');
          return total + peso;
        }, 0);


      let tipoAtendimento = '';

      if (pesoTotal < 50) {
        tipoAtendimento = 'IA'
      }

      if (pesoTotal > 50) {
        tipoAtendimento = 'Profissional'
      }

      const data = {
        tipoAtendimento,
        pacienteId: userId,
        temperatura: formData.temperatura,
        pressaoArterial: formData.pressaoArterial,
        respostas: Object.entries(formData)
          .filter(([key]) => key.startsWith('pergunta_'))
          .map(([_perguntaKey, valor]) => {
            const [indexStr, altIndexStr, _pesoStr] = valor.split('_');
            const perguntaIndex = parseInt(indexStr);
            const altIndex = parseInt(altIndexStr);
            const perguntaSelecionada = perguntas[perguntaIndex];
            const alternativaSelecionada = perguntaSelecionada?.alternativas[altIndex];

            return {
              pergunta: perguntaSelecionada?.pergunta,
              resposta: alternativaSelecionada?.alternativa
            };
          }),
      };
      console.log(data)

      await fetch(`${API_URL}/atendimentos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (pesoTotal < 50) {
        navigate('/antendimento-ia')
      }

      if (pesoTotal > 50) {
        navigate('/medicalChat', {
          state: {
            pesoTotal,
            temperatura: parseFloat(formData.temperatura),
            pressaoArterial: formData.pressaoArterial
          }
        })
      }

    } catch (error) {
      console.log(error)
      alert('Erro ao enviar formulário. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (

    <Container maxWidth="md">
      <AppHeader />
      <Box
        sx={{
          p: 4,
          mt: 9,
        }}
      >
        <Typography variant="h5" align="left" gutterBottom sx={{ mb: 3 }}>
          Formulário de Triagem de Risco de Saúde
        </Typography>
        <Typography variant="body1" align="left" gutterBottom sx={{ mb: 3 }}>
          Marque a opção que melhor descreve sua condição para cada item abaixo.
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="temperatura"
                control={control}
                rules={{
                  required: 'Temperatura é obrigatória',
                  pattern: {
                    value: /^[0-9]{1,2}([,.][0-9]{1})?$/,
                    message: 'Digite uma temperatura válida (ex: 36.5)'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Temperatura (°C)"
                    fullWidth
                    error={!!errors.temperatura}
                    helperText={errors.temperatura?.message}
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]{1,2}([,.][0-9]{1})?'
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="pressaoArterial"
                control={control}
                rules={{
                  required: 'Pressão arterial é obrigatória',
                  pattern: {
                    value: /^[0-9]{2,3}\/[0-9]{2,3}$/,
                    message: 'Digite a pressão no formato correto (ex: 120/80)'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Pressão Arterial (mmHg)"
                    fullWidth
                    error={!!errors.pressaoArterial}
                    helperText={errors.pressaoArterial?.message}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]{2,3}/[0-9]{2,3}'
                    }}
                  />
                )}
              />
            </Grid>

            {perguntas.map((pergunta, index) => (
              <Grid item xs={12} key={index}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 2 }}>
                    {pergunta.pergunta}
                  </FormLabel>
                  {pergunta.observacao && (
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {pergunta.observacao}
                    </Typography>
                  )}
                  <Controller
                    name={`pergunta_${index}`}
                    control={control}
                    defaultValue=""
                    rules={{ required: 'Por favor, selecione uma opção' }}
                    render={({ field: { value, onChange, ...field } }) => (
                      <RadioGroup
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        {...field}
                      >
                        {pergunta.alternativas.map((alt, altIndex) => (
                          <FormControlLabel
                            key={`${index}_${altIndex}`}
                            value={`${index}_${altIndex}_${alt.peso}`}
                            control={<Radio />}
                            label={alt.alternativa}
                          />
                        ))}
                      </RadioGroup>
                    )}
                  />
                </FormControl>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
              >
                Enviar Formulário
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Container>
  );
};

export default HealthRiskForm;
