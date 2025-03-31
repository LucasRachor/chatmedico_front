const loginStyles = {
    container: {
      display: "flex",
      height: "100vh",
      width: "100vw",
      alignItems: "center",
      justifyContent: "center",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: { xs: 2, sm: 4 },
    },
    paper: {
      padding: { xs: 2, sm: 4 },
      width: { xs: "90%", sm: "400px" },
      maxHeight: "90vh",
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
      mb: 3,
      mt: 3,
    },
    logo: {
      height: "150px",
      "@media (max-width: 600px)": {
        height: "100px",
      },
    },
    inputAdornment: {
      startAdornment: {
        position: "start",
      },
    },
    forgotPassword: {
      cursor: "pointer",
      mt: 2,
      fontSize: 15,
    },
    button: {
      mt: 4,
    },
  };
  
  export default loginStyles;
  