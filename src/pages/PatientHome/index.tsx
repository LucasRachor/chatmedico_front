import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, Typography, Paper } from "@mui/material";
import { ChatBubbleOutline, Assignment } from "@mui/icons-material";
import AppHeader from "../../Components/AppHeader/AppHeader";

const PatientHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
      <AppHeader />
      <Box sx={{ mt: { xs: 10, sm: 20 }, textAlign: "center" }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ fontSize: { xs: "1.4rem", sm: "2.125rem" } }}
        >
          Bem-vindo ao seu Ambiente Digital de Enfermagem Monitoramento e Atendimento Inteligente, e-MAI
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Escolha uma opção abaixo para continuar.
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            alignItems: "center",
            backgroundColor: "#F7FAFC",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<ChatBubbleOutline />}
            fullWidth
            sx={{ p: { xs: 1.5, sm: 2 }, fontSize: { xs: "0.95rem", sm: "1.1rem" } }}
            onClick={() => navigate("/patientHistory")}
          >
            Histórico de Atendimentos
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<Assignment />}
            fullWidth
            sx={{ p: { xs: 1.5, sm: 2 }, fontSize: { xs: "0.95rem", sm: "1.1rem" } }}
            onClick={() => navigate("/healthRiskForm")}
          >
            Iniciar Atendimento
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default PatientHome;
