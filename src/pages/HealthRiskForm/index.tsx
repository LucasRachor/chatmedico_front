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
  Alert
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getAuthData } from "../../utils/auth";

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
}

const HealthRiskForm: React.FC = () => {
  const { control, handleSubmit } = useForm<FormData>();
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
        const response = await fetch('http://localhost:4000/api/v1/questionario', {
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

  const onSubmit = async (data: FormData) => {
    if (!token) return;

    try {
      // calcula o peso total das respostas
      const pesoTotal = Object.values(data).reduce((total, peso) => {
        return total + parseInt(peso || '0');
      }, 0);

      const payload = {
        respostas: Object.entries(data).map(([perguntaIndex, peso]) => ({
          perguntaIndex: parseInt(perguntaIndex.split('_')[1]),
          peso: parseInt(peso)
        })),
        pesoTotal
      };

      console.log(payload);

      //const response = await fetch('http://localhost:4000/api/v1/questionario/respostas', {
      //  method: 'POST',
      //  headers: {
      //    'Content-Type': 'application/json',
      //    'Authorization': `Bearer ${token}`
      //  },
      //  body: JSON.stringify(payload)
      //});

      //if (!response.ok) {
      //  throw new Error('Erro ao enviar respostas');
      //}

      alert('Isso vai funcionar depois! hehe');
    } catch (error) {
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
      <Box
        sx={{
          p: 4,
          mt: 5,
        }}
      >
        <Typography variant="h5" align="left" gutterBottom sx={{mb: 3}}>
          Formulário de Triagem de Risco de Saúde
        </Typography>
        <Typography variant="body1" align="left" gutterBottom sx={{mb: 3}}>
          Marque a opção que melhor descreve sua condição para cada item abaixo.
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {perguntas.map((pergunta, index) => (
              <Grid item xs={12} key={index}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{mb: 2}}>
                    {pergunta.pergunta}
                  </FormLabel>
                  {pergunta.observacao && (
                    <Typography variant="body2" color="textSecondary" sx={{mb: 2}}>
                      {pergunta.observacao}
                    </Typography>
                  )}
                  <Controller
                    name={`pergunta_${index}`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <RadioGroup {...field}>
                        {pergunta.alternativas.map((alt, altIndex) => (
                          <FormControlLabel
                            key={altIndex}
                            value={alt.peso.toString()}
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
