import { useRef, useState, useEffect, useCallback } from "react";
import type { Socket } from "socket.io-client";
import Swal from "sweetalert2";

interface UseVideoChatParams {
  socket: typeof Socket.prototype;
  sala: string | null;
  currentUserName: string;
  currentUserRole: string;
}

export interface UseVideoChatReturn {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isCallActive: boolean;
  isConnecting: boolean;
  isWaitingResponse: boolean;
  incomingCall: IncomingCallInfo | null;
  requestCall: () => void;
  acceptIncomingCall: () => Promise<void>;
  declineIncomingCall: () => void;
  endCall: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

interface IncomingCallInfo {
  fromName: string;
  fromRole: string;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const useVideoChat = ({
  socket,
  sala,
  currentUserName,
  currentUserRole,
}: UseVideoChatParams): UseVideoChatReturn => {
  const localVideoRef = useRef<HTMLVideoElement>(null!);
  const remoteVideoRef = useRef<HTMLVideoElement>(null!);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isInitiatorRef = useRef(false);

  // Buffers for signaling messages that arrive before PC is ready
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescriptionSetRef = useRef(false);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(
    null,
  );

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    isInitiatorRef.current = false;
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    remoteDescriptionSetRef.current = false;
    setIsCallActive(false);
    setIsConnecting(false);
    setIsWaitingResponse(false);
    setIncomingCall(null);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
  }, []);

  const showMediaError = useCallback(() => {
    Swal.fire({
      icon: "error",
      title: "Câmera ou microfone indisponível",
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.7;">
          <p>Não foi possível acessar sua câmera ou microfone.</p>
          <p><strong>Verifique se:</strong></p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>Você permitiu o acesso no navegador</li>
            <li>Nenhum outro app está usando a câmera</li>
            <li>O dispositivo está conectado corretamente</li>
          </ul>
        </div>
      `,
      confirmButtonText: "Entendi",
      confirmButtonColor: "#1AC0C6",
    });
  }, []);

  // Flush buffered ICE candidates after remote description is set
  const flushPendingCandidates = useCallback(async () => {
    if (!pcRef.current) return;

    const candidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Erro ao adicionar ICE candidate do buffer:", err);
      }
    }
  }, []);

  const createPeerConnection = useCallback(
    (stream: MediaStream): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && sala) {
          socket.emit("webrtc-ice-candidate", {
            sala,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("[WebRTC] connectionState:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setIsConnecting(false);
          setIsCallActive(true);
        } else if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          cleanup();
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("[WebRTC] iceConnectionState:", pc.iceConnectionState);
        if (
          pc.iceConnectionState === "connected" ||
          pc.iceConnectionState === "completed"
        ) {
          setIsConnecting(false);
          setIsCallActive(true);
        } else if (pc.iceConnectionState === "failed") {
          console.error("[WebRTC] ICE connection failed, restarting ICE...");
          pc.restartIce();
        }
      };

      return pc;
    },
    [sala, socket, cleanup],
  );

  // Acquire media, create PC, and process any buffered offer
  const acquireMediaAndConnect = useCallback(
    async (initiator: boolean) => {
      try {
        setIsConnecting(true);

        console.log("[WebRTC] Requesting media permissions...");
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Câmera/microfone não disponível. Verifique se o site está sendo acessado via HTTPS."
          );
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("[WebRTC] Media acquired successfully");

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection(stream);
        pcRef.current = pc;

        if (initiator) {
          // Initiator creates the offer
          console.log("[WebRTC] Creating offer...");
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", { sala, offer });
          console.log("[WebRTC] Offer sent");
        } else {
          // Receiver: process any buffered offer that arrived while we were getting media
          if (pendingOfferRef.current) {
            console.log("[WebRTC] Processing buffered offer");
            const offer = pendingOfferRef.current;
            pendingOfferRef.current = null;

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            remoteDescriptionSetRef.current = true;

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("webrtc-answer", { sala, answer });
            console.log("[WebRTC] Answer sent (from buffer)");

            // Flush any ICE candidates that arrived before remote description was set
            await flushPendingCandidates();
          }
        }
      } catch (err) {
        console.log(err);
        console.error("[WebRTC] Erro ao acessar câmera/microfone:", err);
        cleanup();

        if (sala) {
          socket.emit("webrtc-media-error", { sala });
        }

        showMediaError();
      }
    },
    [
      sala,
      socket,
      createPeerConnection,
      cleanup,
      showMediaError,
      flushPendingCandidates,
    ],
  );

  // Quem clica no botão: envia convite para o outro lado
  const requestCall = useCallback(() => {
    if (!sala || isCallActive || isConnecting || isWaitingResponse) return;

    isInitiatorRef.current = true;
    setIsWaitingResponse(true);

    socket.emit("webrtc-request-call", {
      sala,
      fromName: currentUserName,
      fromRole: currentUserRole,
    });
  }, [
    sala,
    isCallActive,
    isConnecting,
    isWaitingResponse,
    socket,
    currentUserName,
    currentUserRole,
  ]);

  // Quem recebe o convite: aceita
  const acceptIncomingCall = useCallback(async () => {
    if (!sala) return;

    setIncomingCall(null);
    socket.emit("webrtc-call-response", { sala, accepted: true });

    // Receiver starts media but doesn't create offer (waits for offer from initiator)
    await acquireMediaAndConnect(false);
  }, [sala, socket, acquireMediaAndConnect]);

  // Quem recebe o convite: recusa
  const declineIncomingCall = useCallback(() => {
    if (!sala) return;

    setIncomingCall(null);
    socket.emit("webrtc-call-response", { sala, accepted: false });
  }, [sala, socket]);

  const endCall = useCallback(() => {
    if (sala) {
      socket.emit("webrtc-end-call", { sala });
    }
    cleanup();
  }, [sala, socket, cleanup]);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled((prev) => !prev);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    if (!sala) return;

    // Recebe convite de videochamada
    const handleRequestCall = (data: IncomingCallInfo) => {
      if (!isCallActive && !isConnecting) {
        setIncomingCall(data);
      }
    };

    // Recebe resposta ao convite
    const handleCallResponse = async (data: { accepted: boolean }) => {
      setIsWaitingResponse(false);

      if (data.accepted) {
        // O outro lado aceitou — initiator inicia media e cria offer
        await acquireMediaAndConnect(true);
      } else {
        isInitiatorRef.current = false;

        Swal.fire({
          icon: "info",
          title: "Chamada recusada",
          text: "O outro participante recusou a videochamada.",
          confirmButtonText: "OK",
          confirmButtonColor: "#1AC0C6",
          timer: 4000,
          timerProgressBar: true,
        });
      }
    };

    const handleOffer = async (data: { offer: RTCSessionDescriptionInit }) => {
      if (pcRef.current) {
        // PC is ready — process offer immediately
        try {
          console.log("[WebRTC] Processing offer immediately");
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(data.offer),
          );
          remoteDescriptionSetRef.current = true;

          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          socket.emit("webrtc-answer", { sala, answer });
          console.log("[WebRTC] Answer sent");

          // Flush buffered ICE candidates
          await flushPendingCandidates();
        } catch (err) {
          console.error("[WebRTC] Erro ao processar offer:", err);
          cleanup();
        }
      } else {
        // PC not ready yet (receiver still getting media permissions)
        // Buffer the offer for when PC is created
        console.log("[WebRTC] Buffering offer (PC not ready)");
        pendingOfferRef.current = data.offer;
      }
    };

    const handleAnswer = async (data: {
      answer: RTCSessionDescriptionInit;
    }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );
          remoteDescriptionSetRef.current = true;
          console.log("[WebRTC] Remote description set (answer)");

          // Flush buffered ICE candidates
          await flushPendingCandidates();
        } catch (err) {
          console.error("[WebRTC] Erro ao processar answer:", err);
        }
      }
    };

    const handleIceCandidate = async (data: {
      candidate: RTCIceCandidateInit;
    }) => {
      if (pcRef.current && remoteDescriptionSetRef.current) {
        // Remote description is set — add candidate directly
        try {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        } catch (err) {
          console.error("[WebRTC] Erro ao adicionar ICE candidate:", err);
        }
      } else {
        // Buffer the candidate until remote description is set
        console.log("[WebRTC] Buffering ICE candidate");
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    const handleEndCall = () => {
      cleanup();
    };

    // O outro participante não conseguiu acessar câmera/microfone
    const handleMediaError = () => {
      cleanup();

      Swal.fire({
        icon: "warning",
        title: "Chamada cancelada",
        text: "O outro participante não conseguiu acessar a câmera ou o microfone.",
        confirmButtonText: "OK",
        confirmButtonColor: "#1AC0C6",
        timer: 5000,
        timerProgressBar: true,
      });
    };

    socket.on("webrtc-request-call", handleRequestCall);
    socket.on("webrtc-call-response", handleCallResponse);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);
    socket.on("webrtc-end-call", handleEndCall);
    socket.on("webrtc-media-error", handleMediaError);

    return () => {
      socket.off("webrtc-request-call", handleRequestCall);
      socket.off("webrtc-call-response", handleCallResponse);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
      socket.off("webrtc-end-call", handleEndCall);
      socket.off("webrtc-media-error", handleMediaError);
      cleanup();
    };
  }, [sala, socket, acquireMediaAndConnect, flushPendingCandidates, cleanup]);

  return {
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
  };
};
