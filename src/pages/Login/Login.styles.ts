const loginStyles = {
  container: {
    display: "flex",
    height: "100dvh",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundSize: "cover",
    backgroundPosition: "center",
    padding: { xs: 1.5, sm: 4 },
  },
  paper: {
    padding: { xs: 2.5, sm: 4 },
    width: { xs: "95%", sm: "400px" },
    maxHeight: "90dvh",
    borderRadius: 2,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    scrollbarGutter: "stable",
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "transparent",
      transition: "background 0.2s ease-in-out",
      borderRadius: "4px",
    },
    "&:hover::-webkit-scrollbar-thumb": {
      background: "#888",
      "&:hover": {
        background: "#666",
      },
    },
  },
  title: {
    fontSize: 12,
    color: "textSecondary",
  },
  logoBox: {
    display: "flex",
    justifyContent: "center",
    mb: { xs: 2, sm: 3 },
    mt: { xs: 2, sm: 3 },
  },
  logo: {
    height: "100px",
    maxWidth: "100%",
  } as React.CSSProperties,
  inputAdornment: {
    startAdornment: {
      position: "start",
    },
  },
  registerLink: {
    textDecoration: "none",
    boxShadow: "none",
    cursor: "pointer",
    mt: 2,
    color: "black",
    fontSize: 15,
  },
  button: {
    mt: 3,
    py: 1.5,
  },
};

export default loginStyles;
