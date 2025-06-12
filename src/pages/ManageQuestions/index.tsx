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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import axios from "axios";
import { API_URL } from "../../config/api";
import AppHeader from "../../Components/AppHeader/AppHeader";
import { useNavigate } from "react-router-dom";

type Alternative = {
  id?: string;
  alternativa: string;
  peso: number;
};

type QuestionForm = {
  id?: string;
  pergunta: string;
  peso: number;
  observacao: string;
  alternativas: Alternative[];
};

const RiskAssessment: React.FC = () => {
  const { control, handleSubmit, reset } = useForm<QuestionForm>({
    defaultValues: { pergunta: "", peso: 0, observacao: "", alternativas: [] }
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "alternativas" });
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<QuestionForm[]>(`${API_URL}/questionario`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions(response.data.map(q => ({ ...q, alternativas: q.alternativas ?? [] })));
    } catch (err) {
      console.error("Erro ao buscar perguntas:", err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const onSubmit = async (data: QuestionForm) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado");

      if (editingQuestionId) {
        await axios.patch(
          `${API_URL}/questionario/${editingQuestionId}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchQuestions();
      } else {
        await axios.post<QuestionForm>(
          `${API_URL}/questionario`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchQuestions();
      }

      reset({ pergunta: "", peso: 0, observacao: "", alternativas: [] });
      setEditingQuestionId(null);
    } catch (error) {
      console.error("Erro ao salvar questionário:", error);
    }
  };

  const handleEdit = (question: QuestionForm) => {
    reset(question);
    replace(question.alternativas ?? []);
    setEditingQuestionId(question.id!);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (confirm("Deseja realmente excluir esta pergunta?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_URL}/questionario/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuestions(prev => prev.filter(q => q.id !== id));
      } catch (error) {
        console.error("Erro ao excluir pergunta:", error);
      }
    }
  };

  return (
    <Container maxWidth="md">
      <AppHeader />
      <Box sx={{ bgcolor: "#F7FAFC", p: { xs: 2, sm: 4 }, borderRadius: 2, boxShadow: 2, mt: 15, mb: 5 }}>
        <Button variant="contained" onClick={() => navigate("/patient")} sx={{ mt: 2, mb: 2 }}>
          Voltar
        </Button>

        <Typography variant="h5" align="center" gutterBottom sx={{ mb: 4 }}>
          Criar e Avaliar Formulário de Risco
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller name="pergunta" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Pergunta" variant="outlined" />
              )} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="peso" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Peso da Pergunta" type="number" variant="outlined" />
              )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="observacao" control={control} render={({ field }) => (
                <TextField {...field} fullWidth label="Observação" variant="outlined" />
              )} />
            </Grid>

            {/* Alternativas de Resposta */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Alternativas de Resposta</Typography>
              {fields.map((alt, index) => (
                <Grid container spacing={2} key={alt.id ?? index} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Controller
                      name={`alternativas.${index}.alternativa`}
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} fullWidth label="Texto da Alternativa" variant="outlined" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Controller
                      name={`alternativas.${index}.peso`}
                      control={control}
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
              <Button variant="contained" startIcon={<Add />} onClick={() => append({ alternativa: "", peso: 0 })} sx={{ mt: 2 }}>
                Adicionar Alternativa
              </Button>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                {editingQuestionId ? "Atualizar Pergunta" : "Adicionar Pergunta"}
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
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>{question.pergunta}</TableCell>
                  <TableCell>{question.peso}</TableCell>
                  <TableCell>
                    {(question.alternativas ?? []).map((alt, i) => (
                      <Typography key={i} variant="body2">{`${alt.alternativa} (Peso: ${alt.peso})`}</Typography>
                    ))}
                  </TableCell>
                  <TableCell>{question.observacao}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEdit(question)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(question.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Container>
  );
};

export default RiskAssessment;
