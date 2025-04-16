import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./Theme/theme";
import AppRoutes from "./Routes/Routes";
import { SocketProvider } from "./utils/SocketContext";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </ThemeProvider>
  );
};

export default App;
