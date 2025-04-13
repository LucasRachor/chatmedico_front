import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      textAlign="center"
      sx={{ backgroundColor: "#f5f5f5" }}
    >
      <img src={logo} alt="Logo" style={{ height: 80, marginBottom: 32 }} />
      
      <Typography variant="h2" gutterBottom sx={{ color: "#ff0000" }}>
        404
      </Typography>

      <Typography variant="h5" gutterBottom>
        Página não encontrada
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        A página que você está procurando não existe ou foi removida.
      </Typography>

      {/* Botão para retornar à página inicial 
      <Button 
        variant="contained" 
        onClick={() => navigate("/")}
        sx={{ 
          "&:hover": {
            backgroundColor: "#115293"
          }
        }}
      >
        Voltar para página inicial
      </Button>
      */}
    </Box>
  );
};

export default NotFound;
