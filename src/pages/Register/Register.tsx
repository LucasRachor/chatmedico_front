import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, TextField, Button, Typography, Box, Paper, InputAdornment, LinearProgress, MenuItem } from "@mui/material";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import fundoLogin from "../../assets/fundo-login.jpg";
import logo from "../../assets/logo.svg";
import { registerStyles } from "./Register.styles";

interface FormData {
  cpf: string;
  username: string;
  password: string;
  confirmarSenha: string;
  nome_completo: string;
  telefone: string;
  email: string;
  genero: string;
  grau_de_instrucao: string;
  data_nascimento: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

const generos = ["Masculino", "Feminino", "Outro"];
const grausInstrucao = ["Educação Básica", "Ensino Médio", "Ensino Superior", "Pós-graduação"];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    cpf: "",
    username: "",
    password: "",
    confirmarSenha: "",
    nome_completo: "",
    telefone: "",
    email: "",
    genero: "",
    grau_de_instrucao: "",
    data_nascimento: "",
    endereco: {
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: ""
    }
  });
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as FormData['endereco']),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    updateProgress();
  };

  const updateProgress = () => {
    const requiredFields = [
      formData.cpf,
      formData.username,
      formData.password,
      formData.nome_completo,
      formData.telefone,
      formData.email,
      formData.genero,
      formData.grau_de_instrucao,
      formData.data_nascimento,
      formData.endereco.rua,
      formData.endereco.numero,
      formData.endereco.bairro,
      formData.endereco.cidade,
      formData.endereco.estado,
      formData.endereco.cep
    ];
    const filledFields = requiredFields.filter(field => field !== "").length;
    setProgress((filledFields / requiredFields.length) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }

    // Calcular idade a partir da data de nascimento
    const dataNascimento = new Date(formData.data_nascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - dataNascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = dataNascimento.getMonth();
    
    if (mesNascimento > mesAtual || 
        (mesNascimento === mesAtual && dataNascimento.getDate() > hoje.getDate())) {
      idade--;
    }

    try {
      const response = await fetch("http://localhost:4000/api/v1/pacientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cpf: formData.cpf,
          username: formData.username,
          password: formData.password,
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          email: formData.email,
          genero: formData.genero,
          grau_de_instrucao: formData.grau_de_instrucao,
          data_nascimento: formData.data_nascimento,
          idade: idade,
          endereco: formData.endereco,
          role: "paciente"
        }),
      });

      if (response.status === 201) {
        navigate("/");
      }
      if (!response.ok) {
        throw new Error("Erro ao cadastrar");
      }

      navigate("/login");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ ...registerStyles.container, backgroundImage: `url(${fundoLogin})` }}>
      <Paper elevation={3} sx={registerStyles.paper}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
          <Typography sx={registerStyles.title}>CADASTRO DE PACIENTE</Typography>
          <Box sx={registerStyles.logoBox}>
            <img src={logo} alt="PAeSD Logo" style={registerStyles.logo} />
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={registerStyles.progressBar}
            color={progress === 100 ? "success" : "primary"}
          />

          <form onSubmit={handleSubmit} style={registerStyles.form}>
            <Box sx={registerStyles.formSection}>
              <Typography sx={registerStyles.sectionTitle}>Dados Pessoais</Typography>
              <Box sx={registerStyles.gridContainer}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="CPF"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
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
                  label="Nome de Usuário"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Nome Completo"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="E-mail"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneOutlinedIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  select
                  variant="outlined"
                  label="Gênero"
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  required
                >
                  {generos.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  select
                  variant="outlined"
                  label="Grau de Instrução"
                  name="grau_de_instrucao"
                  value={formData.grau_de_instrucao}
                  onChange={handleChange}
                  required
                >
                  {grausInstrucao.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Data de Nascimento"
                  name="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>

            <Box sx={registerStyles.formSection}>
              <Typography sx={registerStyles.sectionTitle}>Endereço</Typography>
              <Box sx={registerStyles.addressGrid}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Rua"
                  name="endereco.rua"
                  value={formData.endereco.rua}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeOutlinedIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Número"
                  name="endereco.numero"
                  value={formData.endereco.numero}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Bairro"
                  name="endereco.bairro"
                  value={formData.endereco.bairro}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Cidade"
                  name="endereco.cidade"
                  value={formData.endereco.cidade}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Estado"
                  name="endereco.estado"
                  value={formData.endereco.estado}
                  onChange={handleChange}
                  required
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="CEP"
                  name="endereco.cep"
                  value={formData.endereco.cep}
                  onChange={handleChange}
                  required
                />
              </Box>
            </Box>

            <Box sx={registerStyles.formSection}>
              <Typography sx={registerStyles.sectionTitle}>Senha</Typography>
              <Box sx={registerStyles.gridContainer}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Senha"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Confirmar Senha"
                  name="confirmarSenha"
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            {error && <Typography sx={registerStyles.errorMessage}>{error}</Typography>}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={registerStyles.button}
              type="submit"
            >
              CADASTRAR
            </Button>
          </form>

          <Typography sx={{ textAlign: 'center', mt: 2 }}>
            Já tem uma conta?{" "}
            <Button
              color="primary"
              onClick={() => navigate("/login")}
              sx={{ textTransform: 'none' }}
            >
              Faça login
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register; 