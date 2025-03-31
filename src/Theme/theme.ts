import { createTheme } from "@mui/material/styles";

// Definição das cores baseada na imagem
const theme = createTheme({
  palette: {
    primary: {
      main: "#1AC0C6", // Azul principal (ajuste conforme necessário)
      contrastText: "#FFFFFF", // Texto sobre o botão azul
    },
    secondary: {
      main: "#00C2CB", // Verde-água secundário
    },
    background: {
      default: "#F3FCFD", // Cor do fundo
      paper: "#FFFFFF", // Fundo dos cards (como o Paper)
    },
    text: {
      primary: "#161616", // Cor do texto principal
      secondary: "#006064", // Cor do texto secundário
    },
  },
  typography: {
    fontFamily: `"Roboto", "Arial", sans-serif`,
  },
  shape: {
    borderRadius: 12, // Borda arredondada padrão
  },
});

export default theme;
