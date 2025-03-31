import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./Theme/theme";
import AppRoutes from "./Routes/Routes";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
};

export default App;
