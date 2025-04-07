import React, { useState } from "react";
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

  const onSubmit = async (data: QuestionForm) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado");
      }

      await axios.post("http://localhost:4000/api/v1/questionario", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const handleDelete = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
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
      <Box sx={{ bgcolor: "#F7FAFC", p: { xs: 2, sm: 4 }, borderRadius: 2, boxShadow: 2, mt: 5 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Criar e Avaliar Formulário de Risco
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="pergunta"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Pergunta" variant="outlined" />
                )}
              />
            </Grid>

            <Grid item xs={6}>
              <Controller
                name="peso"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Peso da Pergunta" type="number" variant="outlined" />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="observacao"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField {...field} fullWidth label="Observação" variant="outlined" />
                )}
              />
            </Grid>

            {/* Alternativas de Resposta */}
            <Grid item xs={12}>
              <Typography variant="subtitle1">Alternativas de Resposta</Typography>
              {fields.map((alt, index) => (
                <Grid container spacing={2} key={alt.id} alignItems="center">
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
              <Button variant="outlined" startIcon={<Add />} onClick={() => append({ alternativa: "", peso: 0 })}>
                Adicionar Alternativa
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                {editingIndex !== null ? "Atualizar Pergunta" : "Adicionar Pergunta"}
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Tabela de perguntas */}
        <Table sx={{ mt: 3 }}>
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
            {questions.map((question, index) => (
              <TableRow key={index}>
                <TableCell>{question.pergunta}</TableCell>
                <TableCell>{question.peso}</TableCell>
                <TableCell>
                  {question.alternativas.map((alt, i) => (
                    <div key={i}>{`${alt.alternativa} (Peso: ${alt.peso})`}</div>
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

        {/* Formulário do paciente */}
        <Button variant="contained" color="secondary" fullWidth onClick={() => setOpenDialog(true)}>
          Preencher Formulário
        </Button>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
          <DialogTitle>Preencher Avaliação</DialogTitle>
          <DialogContent>
            {questions.map((question, index) => (
              <Box key={index} mt={2}>
                <Typography>{question.pergunta}</Typography>
                <RadioGroup onChange={(e) => handleAnswerChange(index, Number(e.target.value))}>
                  {question.alternativas.map((alt, i) => (
                    <FormControlLabel key={i} value={alt.peso} control={<Radio />} label={alt.alternativa} />
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

        {riskScore !== null && <Typography align="center">Risco Total: {riskScore}</Typography>}
      </Box>
    </Container>
  );
};

export default RiskAssessment;
