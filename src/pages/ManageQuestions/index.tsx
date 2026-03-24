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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import api from "../../config/api";
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
  const { control, handleSubmit, reset, formState: { errors } } = useForm<QuestionForm>({
    defaultValues: { pergunta: "", peso: 0, observacao: "", alternativas: [] }
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "alternativas" });
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const navigate = useNavigate();

  const fetchQuestions = async () => {
    try {
      const response = await api.get<QuestionForm[]>('/questionario');
      setQuestions(response.data.map(q => ({ ...q, alternativas: q.alternativas ?? [] })));
    } catch (err) {
      setSnackbar({ open: true, message: "Erro ao buscar perguntas", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const onSubmit = async (data: QuestionForm) => {
    try {
      if (editingQuestionId) {
        await api.patch(`/questionario/${editingQuestionId}`, data);
        setSnackbar({ open: true, message: "Pergunta atualizada com sucesso!", severity: "success" });
      } else {
        await api.post<QuestionForm>('/questionario', data);
        setSnackbar({ open: true, message: "Pergunta adicionada com sucesso!", severity: "success" });
      }
      fetchQuestions();
      reset({ pergunta: "", peso: 0, observacao: "", alternativas: [] });
      setEditingQuestionId(null);
    } catch (error) {
      setSnackbar({ open: true, message: "Erro ao salvar pergunta", severity: "error" });
    }
  };

  const handleEdit = (question: QuestionForm) => {
    reset(question);
    replace(question.alternativas ?? []);
    setEditingQuestionId(question.id!);
  };

  const handleCancelEdit = () => {
    reset({ pergunta: "", peso: 0, observacao: "", alternativas: [] });
    setEditingQuestionId(null);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteDialog.id;
    setDeleteDialog({ open: false, id: null });
    if (!id) return;
    try {
      await api.delete(`/questionario/${id}`);
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSnackbar({ open: true, message: "Pergunta excluída com sucesso!", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: "Erro ao excluir pergunta", severity: "error" });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <AppHeader />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1, sm: 3 } }}>
      <AppHeader />
      <Box sx={{ bgcolor: "#F7FAFC", p: { xs: 1.5, sm: 4 }, borderRadius: 2, boxShadow: 2, mt: { xs: 8, sm: 15 }, mb: 5 }}>
        <Button variant="contained" onClick={() => navigate("/patient")} sx={{ mt: 2, mb: 2 }}>
          Voltar
        </Button>

        <Typography variant="h5" align="center" gutterBottom sx={{ mb: 4 }}>
          {editingQuestionId ? "Editar Pergunta" : "Criar e Avaliar Formulário de Risco"}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="pergunta"
                control={control}
                rules={{ required: "Pergunta é obrigatória" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Pergunta"
                    variant="outlined"
                    error={!!errors.pergunta}
                    helperText={errors.pergunta?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <Controller
                name="peso"
                control={control}
                rules={{ required: "Peso é obrigatório", min: { value: 0, message: "Peso deve ser positivo" } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Peso da Pergunta"
                    type="number"
                    variant="outlined"
                    error={!!errors.peso}
                    helperText={errors.peso?.message}
                  />
                )}
              />
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
                      rules={{ required: "Texto da alternativa é obrigatório" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Texto da Alternativa"
                          variant="outlined"
                          error={!!errors.alternativas?.[index]?.alternativa}
                          helperText={errors.alternativas?.[index]?.alternativa?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <Controller
                      name={`alternativas.${index}.peso`}
                      control={control}
                      rules={{ required: "Peso é obrigatório" }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Peso"
                          type="number"
                          variant="outlined"
                          error={!!errors.alternativas?.[index]?.peso}
                          helperText={errors.alternativas?.[index]?.peso?.message}
                        />
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

            <Grid item xs={12} sx={{ mt: 2, display: "flex", gap: 2 }}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                {editingQuestionId ? "Atualizar Pergunta" : "Adicionar Pergunta"}
              </Button>
              {editingQuestionId && (
                <Button variant="outlined" color="inherit" fullWidth onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
            </Grid>
          </Grid>
        </form>

        {/* Tabela de perguntas */}
        <Box sx={{ mt: 4, mb: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {questions.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              Nenhuma pergunta cadastrada ainda.
            </Typography>
          ) : (
            <Table sx={{ minWidth: 500 }}>
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
                      <IconButton color="error" onClick={() => setDeleteDialog({ open: true, id: question.id || null })}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deseja realmente excluir esta pergunta? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Excluir</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
    </Container>
  );
};

export default RiskAssessment;
