import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Typography, Paper } from "@mui/material";
import { ChatBubbleOutline, Assignment } from "@mui/icons-material";

const PatientHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 5, textAlign: "center" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Bem-vindo à Plataforma de Atendimento em Saúde Digital
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Escolha uma opção abaixo para continuar.
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
            backgroundColor: "#F7FAFC", // Mantendo o padrão de cores do sistema
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<ChatBubbleOutline />}
            fullWidth
            sx={{ p: 2, fontSize: "1.1rem" }}
            onClick={() => navigate("/medicalChat")}
          >
            Acessar Chat Médico
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<Assignment />}
            fullWidth
            sx={{ p: 2, fontSize: "1.1rem" }}
            onClick={() => navigate("/healthRiskForm")}
          >
            Preencher Formulário de Triagem
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default PatientHome;
