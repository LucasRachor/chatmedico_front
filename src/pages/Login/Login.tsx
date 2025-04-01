import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box, Paper, InputAdornment } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import fundoLogin from "../../assets/fundo-login.jpg";
import logo from "../../assets/logo.svg";
import loginStyles from "./Login.styles";
import { decodeJwtToken } from "../../utils/jwt";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      const response = await fetch("http://localhost:4000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Erro ao fazer login");
      }

      const token = data.access_token;
      const decodedToken = decodeJwtToken(token);

      if (!decodedToken) {
        throw new Error("Token inválido");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", decodedToken.role);

      if (decodedToken.role === "medico") {
        navigate("/patient");
      } else if (decodedToken.role === "paciente") {
        navigate("/patientHome");
      } else {
        throw new Error("Tipo de usuário não reconhecido");
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ ...loginStyles.container, backgroundImage: `url(${fundoLogin})` }}>
      <Paper elevation={3} sx={loginStyles.paper}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={loginStyles.title}>ÁREA DE ACESSO</Typography>
          <Box sx={loginStyles.logoBox}>
            <img src={logo} alt="PAeSD Logo" style={loginStyles.logo} />
          </Box>
          <Typography color="textSecondary" gutterBottom sx={{ fontSize: 15 }}>
            Para usuários cadastrados, utilize suas credenciais abaixo:
          </Typography>

          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            label="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            variant="outlined"
            margin="normal"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon />
                </InputAdornment>
              ),
            }}
          />
          {error && <Typography color="error">{error}</Typography>}
          <Typography sx={loginStyles.forgotPassword}>Esqueceu a senha? Clique aqui.</Typography>
          <Button fullWidth variant="contained" color="primary" size="large" sx={loginStyles.button} onClick={handleLogin}>
            LOGIN
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
