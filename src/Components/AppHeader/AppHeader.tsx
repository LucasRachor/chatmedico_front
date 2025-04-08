import { useState } from "react";
import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Avatar, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import logo from "../../assets/logo-web.svg";
import { getAuthData, logout } from "../../utils/auth";

const AppHeader: React.FC = () => {
  const { token } = getAuthData();
  const [userName, setUserName] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const userId = payload?.sub;

  const fetchPacienteData = async (userId: string) => {
    if (!token || !userId) return;
    try {
      const response = await fetch(`http://localhost:4000/api/v1/users/find/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do paciente');
      }

      const data = await response.json();
      setUserName(data)
    } catch (error) {
      console.error('Erro ao buscar dados do paciente:', error);
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

  fetchPacienteData(userId)

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
          <Avatar alt="Dr. Mateus Ramos de Oliveira" src="/path-to-avatar.jpg" />
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={handleMenuClose}>Mudar usuário</MenuItem>
            <MenuItem onClick={handleLogout}>Sair da sessão</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
