import React from "react";
import {
  Box,
  IconButton,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Fade,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import CallIcon from "@mui/icons-material/Call";
import CallEndOutlinedIcon from "@mui/icons-material/CallEndOutlined";
import type { UseVideoChatReturn } from "../../hooks/useVideoChat";

const getRoleLabel = (role: string): string => {
  switch (role) {
    case "medico":
      return "Medico";
    case "enfermeiro":
      return "Enfermeiro";
    case "paciente":
      return "Paciente";
    case "admin":
      return "Admin";
    default:
      return role;
  }
};

type VideoPanelProps = UseVideoChatReturn;

const VideoPanel: React.FC<VideoPanelProps> = ({
  localVideoRef,
  remoteVideoRef,
  isVideoEnabled,
  isAudioEnabled,
  isCallActive,
  isConnecting,
  isWaitingResponse,
  incomingCall,
  requestCall,
  acceptIncomingCall,
  declineIncomingCall,
  endCall,
  toggleVideo,
  toggleAudio,
}) => {
  // Modal de convite recebido
  if (incomingCall) {
    return (
      <Fade in>
        <Paper
          elevation={4}
          sx={{
            mb: 2,
            borderRadius: 3,
            overflow: "hidden",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 4,
              px: 3,
            }}
          >
            {/* Icone animado */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(26, 192, 198, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
                animation: "pulse 2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%": {
                    boxShadow: "0 0 0 0 rgba(26, 192, 198, 0.4)",
                  },
                  "70%": {
                    boxShadow: "0 0 0 20px rgba(26, 192, 198, 0)",
                  },
                  "100%": {
                    boxShadow: "0 0 0 0 rgba(26, 192, 198, 0)",
                  },
                },
              }}
            >
              <VideoCallIcon sx={{ fontSize: 40, color: "#1AC0C6" }} />
            </Box>

            <Typography
              variant="h6"
              sx={{ color: "white", fontWeight: 600, mb: 0.5 }}
            >
              Videochamada recebida
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: "rgba(255,255,255,0.7)", mb: 0.5 }}
            >
              {incomingCall.fromName}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#1AC0C6",
                fontWeight: 500,
                mb: 3,
                textTransform: "capitalize",
              }}
            >
              {getRoleLabel(incomingCall.fromRole)}
            </Typography>

            <Box sx={{ display: "flex", gap: 3 }}>
              <Box sx={{ textAlign: "center" }}>
                <IconButton
                  onClick={declineIncomingCall}
                  sx={{
                    width: 56,
                    height: 56,
                    backgroundColor: "#d32f2f",
                    color: "white",
                    "&:hover": { backgroundColor: "#b71c1c" },
                    mb: 0.5,
                  }}
                >
                  <CallEndOutlinedIcon />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.5)", display: "block" }}
                >
                  Recusar
                </Typography>
              </Box>

              <Box sx={{ textAlign: "center" }}>
                <IconButton
                  onClick={acceptIncomingCall}
                  sx={{
                    width: 56,
                    height: 56,
                    backgroundColor: "#2e7d32",
                    color: "white",
                    "&:hover": { backgroundColor: "#1b5e20" },
                    mb: 0.5,
                  }}
                >
                  <CallIcon />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255,255,255,0.5)", display: "block" }}
                >
                  Aceitar
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>
    );
  }

  // Aguardando resposta do outro participante
  if (isWaitingResponse) {
    return (
      <Fade in>
        <Paper
          elevation={3}
          sx={{
            mb: 2,
            borderRadius: 3,
            overflow: "hidden",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 4,
              px: 3,
            }}
          >
            <CircularProgress
              size={44}
              sx={{ color: "#1AC0C6", mb: 2 }}
            />
            <Typography
              variant="h6"
              sx={{ color: "white", fontWeight: 500, mb: 0.5 }}
            >
              Chamando...
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.5)", mb: 2.5 }}
            >
              Aguardando o outro participante aceitar
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<CallEndIcon />}
              onClick={endCall}
              sx={{
                borderColor: "rgba(211,47,47,0.5)",
                color: "#ef5350",
                "&:hover": {
                  borderColor: "#d32f2f",
                  backgroundColor: "rgba(211,47,47,0.08)",
                },
              }}
            >
              Cancelar
            </Button>
          </Box>
        </Paper>
      </Fade>
    );
  }

  // Botao para iniciar chamada (estado idle)
  if (!isCallActive && !isConnecting) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<VideoCallIcon />}
          onClick={requestCall}
          sx={{
            borderRadius: 2,
            borderColor: "#1AC0C6",
            color: "#1AC0C6",
            "&:hover": {
              borderColor: "#17a9ae",
              backgroundColor: "rgba(26,192,198,0.04)",
            },
          }}
        >
          Iniciar Videochamada
        </Button>
      </Box>
    );
  }

  // Chamada ativa / conectando
  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "#1a1a2e",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          maxHeight: 360,
          backgroundColor: "#0f0f23",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Video remoto */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {isConnecting && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <CircularProgress sx={{ color: "white", mb: 1 }} />
            <Typography variant="body2" sx={{ color: "white" }}>
              Conectando...
            </Typography>
          </Box>
        )}

        {/* Video local (picture-in-picture) */}
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            width: { xs: 100, sm: 160 },
            height: { xs: 75, sm: 120 },
            borderRadius: 1.5,
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.3)",
            backgroundColor: "#0f0f23",
          }}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />
        </Box>
      </Box>

      {/* Controles */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          py: 1.5,
          backgroundColor: "#16213e",
        }}
      >
        <IconButton
          onClick={toggleAudio}
          sx={{
            color: isAudioEnabled ? "white" : "#ef5350",
            backgroundColor: isAudioEnabled
              ? "rgba(255,255,255,0.1)"
              : "rgba(239,83,80,0.2)",
            "&:hover": {
              backgroundColor: isAudioEnabled
                ? "rgba(255,255,255,0.2)"
                : "rgba(239,83,80,0.3)",
            },
          }}
        >
          {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
        </IconButton>

        <IconButton
          onClick={toggleVideo}
          sx={{
            color: isVideoEnabled ? "white" : "#ef5350",
            backgroundColor: isVideoEnabled
              ? "rgba(255,255,255,0.1)"
              : "rgba(239,83,80,0.2)",
            "&:hover": {
              backgroundColor: isVideoEnabled
                ? "rgba(255,255,255,0.2)"
                : "rgba(239,83,80,0.3)",
            },
          }}
        >
          {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>

        <IconButton
          onClick={endCall}
          sx={{
            color: "white",
            backgroundColor: "#d32f2f",
            "&:hover": { backgroundColor: "#b71c1c" },
          }}
        >
          <CallEndIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default VideoPanel;
