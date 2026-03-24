import { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Box,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import logo from "../../assets/logo.png";
import { getAuthData, logout } from "../../utils/auth";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { token } = getAuthData();
  const [userName, setUserName] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Extrai payload do token (se existir)
  const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const userId = payload?.sub as string | undefined;

  const fetchPacienteData = async (userId: string) => {
    if (!token || !userId) return;
    try {
      const { data } = await api.get(`/users/find/${userId}`);
      setUserName(typeof data === "string" ? data : data.nomeCompleto);
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
        width: "100%",
        bgcolor: "#FFF",
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box display="flex" alignItems="center">
          <img
            onClick={() => navigate("/")}
            src={logo}
            alt="Logo"
            style={{ height: 36, marginRight: 8 }}
          />
        </Box>
        <Box display="flex" alignItems="center">
          <Typography
            variant="body2"
            sx={{
              mr: 1,
              color: "GrayText",
              display: { xs: "none", sm: "block" },
            }}
          >
            {userName}
          </Typography>
          <Avatar
            alt={userName || ""}
            src="/path-to-avatar.jpg"
            sx={{ width: 32, height: 32 }}
          />
          <IconButton onClick={handleMenuOpen} size="small">
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {/* <MenuItem onClick={handleMenuClose}>Mudar usuário</MenuItem> */}
            <MenuItem onClick={handleLogout}>Sair da sessão</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
