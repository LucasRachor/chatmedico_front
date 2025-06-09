import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import axios from "axios";
import { API_URL } from "../../config/api";
import AppHeader from "../../Components/AppHeader/AppHeader";

type Alternative = {
  alternativa: string;
  peso: number;
};

type QuestionForm = {
  pergunta: string;
  peso: number;
  observacao: string;
  alternativas: Alternative[];
};

const RiskAssessment: React.FC = () => {
  const { control, handleSubmit, reset, setValue } = useForm<QuestionForm>();
  const { fields, append, remove } = useFieldArray({ control, name: "alternativas" });
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [riskScore, setRiskScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/questionario`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions(response.data);
      } catch (err) {
        console.error("Erro ao buscar perguntas:", err);
      }
    };
    fetchQuestions();
  }, []);

  const onSubmit = async (data: QuestionForm) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      await axios.post(`${API_URL}/questionario`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (editingIndex !== null) {
        const updatedQuestions = [...questions];
        updatedQuestions[editingIndex] = data;
        setQuestions(updatedQuestions);
        setEditingIndex(null);
      } else {
        setQuestions([...questions, data]);
      }
      reset();
    } catch (error) {
      console.error("Erro ao criar questionário:", error);
    }
  };

  const handleEdit = (index: number) => {
    const question = questions[index];
    setValue("pergunta", question.pergunta);
    setValue("peso", question.peso);
    setValue("observacao", question.observacao);
    setValue("alternativas", question.alternativas);
    setEditingIndex(index);
  };

  const handleDelete = async (index: number) => {
    if (confirm("Deseja realmente excluir esta pergunta?")) {
      try {
        const token = localStorage.getItem("token");
        const questionId = questions[index].id;
        await axios.delete(`${API_URL}/questionario/${questionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions(questions.filter((_, i) => i !== index));
      } catch (error) {
        console.error("Erro ao excluir pergunta:", error);
      }
    }
  };

  const handleAnswerChange = (questionIndex: number, alternativeWeight: number) => {
    setAnswers({ ...answers, [questionIndex]: alternativeWeight });
  };

  const calculateRisk = () => {
    const totalRisk = Object.values(answers).reduce((sum, weight) => sum + weight, 0);
    setRiskScore(totalRisk);
  };

  return (
    <Container maxWidth="md">
      <AppHeader />
      <Box sx={{ bgcolor: "#F7FAFC", p: { xs: 2, sm: 4 }, borderRadius: 2, boxShadow: 2, mt: 15, mb: 5 }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ mb: 4 }}>
          Criar e Avaliar Formulário de Risco
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller name="pergunta" control={control} defaultValue="" render={({ field }) => (
                <TextField {...field} fullWidth label="Pergunta" variant="outlined" />
              )} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="peso" control={control} defaultValue={0} render={({ field }) => (
                <TextField {...field} fullWidth label="Peso da Pergunta" type="number" variant="outlined" />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="observacao" control={control} defaultValue="" render={({ field }) => (
                <TextField {...field} fullWidth label="Observação" variant="outlined" />
              )} />
            </Grid>

            {/* Alternativas de Resposta */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Alternativas de Resposta</Typography>
              {fields.map((alt, index) => (
                <Grid container spacing={2} key={alt.id} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Controller
                      name={`alternativas.${index}.alternativa`}
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Texto da Alternativa" variant="outlined" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Controller
                      name={`alternativas.${index}.peso`}
                      control={control}
                      defaultValue={0}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Peso" type="number" variant="outlined" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton color="error" onClick={() => remove(index)}>
                      <Delete />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button variant="outlined" startIcon={<Add />} onClick={() => append({ alternativa: "", peso: 0 })} sx={{ mt: 2 }}>
                Adicionar Alternativa
              </Button>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                {editingIndex !== null ? "Atualizar Pergunta" : "Adicionar Pergunta"}
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Tabela de perguntas */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pergunta</TableCell>
                <TableCell>Peso</TableCell>
                <TableCell>Alternativas</TableCell>
                <TableCell>Observação</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...questions].reverse().map((question, index) => (
                <TableRow key={index}>
                  <TableCell>{question.pergunta}</TableCell>
                  <TableCell>{question.peso}</TableCell>
                  <TableCell>
                    {question.alternativas.map((alt, i) => (
                      <Typography key={i} variant="body2">{`${alt.alternativa} (Peso: ${alt.peso})`}</Typography>
                    ))}
                  </TableCell>
                  <TableCell>{question.observacao}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEdit(index)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(index)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Formulário do paciente */}
        <Button variant="contained" color="primary" fullWidth onClick={() => setOpenDialog(true)} sx={{ mb: 3 }}>
          Preencher Formulário
        </Button>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
          <DialogTitle>Preencher Avaliação</DialogTitle>
          <DialogContent>
            {questions.map((question, index) => (
              <Box key={index} mt={3} mb={3}>
                <Typography variant="subtitle1" gutterBottom>{question.pergunta}</Typography>
                <RadioGroup onChange={(e) => handleAnswerChange(index, Number(e.target.value))}>
                  {question.alternativas.map((alt, i) => (
                    <FormControlLabel key={i} value={alt.peso} control={<Radio />} label={alt.alternativa} sx={{ mb: 1 }} />
                  ))}
                </RadioGroup>
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={calculateRisk} variant="contained" color="primary">
              Calcular Risco
            </Button>
          </DialogActions>
        </Dialog>

        {riskScore !== null && (
          <Typography align="center" variant="h6" sx={{ mt: 3, p: 2, bgcolor: riskScore > 50 ? '#ffebee' : '#e8f5e9', borderRadius: 2 }}>
            Risco Total: {riskScore}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default RiskAssessment;
