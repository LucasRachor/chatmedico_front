import { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Box
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import logo from "../../assets/logo.png";
import { getAuthData, logout } from "../../utils/auth";
import { API_URL } from "../../config/api";

const AppHeader: React.FC = () => {
  const { token } = getAuthData();
  const [userName, setUserName] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Extrai payload do token (se existir)
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const userId = payload?.sub as string | undefined;

  const fetchPacienteData = async (userId: string) => {
    if (!token || !userId) return;
    try {
      const response = await fetch(`${API_URL}/users/find/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar dados do paciente");
      }
      const data = await response.json();
      // Supondo que `data` seja apenas a string com o nome do usuário,
      // ou um objeto { nome: string } — ajuste conforme seu back.
      setUserName(typeof data === "string" ? data : data.nome);
    } catch (error) {
      console.error("Erro ao buscar dados do paciente:", error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    if (userId && token) {
      fetchPacienteData(userId);
    }
  }, [userId, token]);

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        top: 0,
        left: 0,
        width: "100vw",
        bgcolor: "#FFF",
        zIndex: 1100, // Para ficar acima de outros elementos
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box display="flex" alignItems="center">
          <img src={logo} alt="Logo" style={{ height: 40, marginRight: 8 }} />
        </Box>
        <Box display="flex" alignItems="center">
          <Typography variant="body1" sx={{ mr: 2, color: "GrayText" }}>
            {userName}
          </Typography>
          <Avatar alt={userName || ""} src="/path-to-avatar.jpg" />
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Mudar usuário</MenuItem>
            <MenuItem onClick={handleLogout}>Sair da sessão</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
