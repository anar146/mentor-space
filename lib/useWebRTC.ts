'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Singleton socket — created once, reused across re-renders / hot-reloads
let _socket: Socket | null = null;
function getSocket(): Socket {
  if (!_socket) {
    _socket = io('http://localhost:4000', { transports: ['websocket'], autoConnect: true });
  }
  return _socket;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(sessionId: string, userId: string) {
  const socket = getSocket();

  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const makingOffer    = useRef(false);

  const [isConnected,    setIsConnected]    = useState(false);
  const [isMicOn,        setIsMicOn]        = useState(true);
  const [isCamOn,        setIsCamOn]        = useState(true);
  const [isScreenSharing,setIsScreenSharing]= useState(false);
  const [error,          setError]          = useState<string | null>(null);

  // ── Peer connection factory ────────────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    // FIX 1: Always close the old PC first.
    // Without this, calling initiateCall() twice stacks two PCs and causes
    // "InvalidStateError: setLocalDescription called in wrong state".
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('webrtc:ice', { sessionId, candidate: e.candidate.toJSON(), from: userId });
      }
    };

    // FIX 2: e.streams[0] can be undefined if remote tracks arrive before
    // the stream is fully set up. Build the MediaStream manually from tracks.
    pc.ontrack = (e) => {
      if (!remoteVideoRef.current) return;
      if (!remoteVideoRef.current.srcObject) {
        remoteVideoRef.current.srcObject = new MediaStream();
      }
      (remoteVideoRef.current.srcObject as MediaStream).addTrack(e.track);
      setIsConnected(true);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected')   setIsConnected(true);
      if (pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed')       setIsConnected(false);
    };

    // FIX 3: Use onnegotiationneeded instead of manually creating the offer
    // right after addTrack. This fires at the right time and handles
    // re-negotiation (e.g. after replacing a track for screen share).
    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.current = true;
        await pc.setLocalDescription(await pc.createOffer());
        if (pc.signalingState !== 'have-local-offer') return;
        socket.emit('webrtc:offer', { sessionId, sdp: pc.localDescription, from: userId });
      } catch (err) {
        console.error('Negotiation error:', err);
      } finally {
        makingOffer.current = false;
      }
    };

    pcRef.current = pc;
    return pc;
  }, [sessionId, userId, socket]);

  // ── Get camera + mic ────────────────────────────────────────────────────────
  const getLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      // FIX 4: Stop existing tracks before requesting a new stream.
      // Without this, calling getUserMedia again while the camera is already
      // open throws "NotReadableError: device already in use".
      localStreamRef.current?.getTracks().forEach(t => t.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError'  ? 'Camera/mic permission denied. Allow access in your browser settings.' :
        err.name === 'NotFoundError'    ? 'No camera or microphone found on this device.' :
        err.name === 'NotReadableError' ? 'Camera is already in use by another app.' :
        `Media error: ${err.message}`;
      setError(msg);
      console.error('getUserMedia failed:', err);
      return null;
    }
  }, []);

  // ── Initiate call (caller side) ─────────────────────────────────────────────
  const initiateCall = useCallback(async () => {
    const stream = await getLocalStream();
    if (!stream) return;
    const pc = createPeerConnection();
    // Adding tracks triggers onnegotiationneeded → creates offer automatically
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  }, [getLocalStream, createPeerConnection]);

  // ── Screen share ────────────────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true,
      });
      const videoTrack = screenStream.getVideoTracks()[0];

      // Replace video track on the existing sender — triggers re-negotiation
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(videoTrack);

      // Show screen in local preview (keep existing audio tracks)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = new MediaStream([
          videoTrack,
          ...(localStreamRef.current?.getAudioTracks() ?? []),
        ]);
      }
      setIsScreenSharing(true);

      // When user presses "Stop sharing" in the browser's native UI
      videoTrack.onended = async () => {
        setIsScreenSharing(false);
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack) {
          const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
          if (sender) await sender.replaceTrack(camTrack);
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      };
    } catch (err: any) {
      // User cancelled — not a real error
      if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
        setError(`Screen share failed: ${err.message}`);
      }
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(camTrack);
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setIsScreenSharing(false);
  }, []);

  // ── Incoming signal listeners ───────────────────────────────────────────────
  useEffect(() => {
    const handleOffer = async ({ sdp, from }: { sdp: RTCSessionDescriptionInit; from: string }) => {
      if (makingOffer.current) return; // glare — we're already sending an offer

      const stream = await getLocalStream();
      if (!stream) return;

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc:answer', { sessionId, sdp: answer, from: userId });
    };

    const handleAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) return;
      if (pcRef.current.signalingState === 'have-local-offer') {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    const handleIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        if (pcRef.current && candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch {
        // Safe to ignore: can fire during re-negotiation after track replace
      }
    };

    socket.on('webrtc:offer',  handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice',    handleIce);

    return () => {
      socket.off('webrtc:offer',  handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice',    handleIce);
    };
  }, [sessionId, userId, socket, getLocalStream, createPeerConnection]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
  }, []);

  // ── Controls ────────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMicOn(p => !p);
  }, []);

  const toggleCam = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOn(p => !p);
  }, []);

  const hangUp = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setIsConnected(false);
    setIsScreenSharing(false);
  }, []);

  return {
    localVideoRef, remoteVideoRef,
    isConnected, isMicOn, isCamOn, isScreenSharing, error,
    initiateCall, startScreenShare, stopScreenShare,
    toggleMic, toggleCam, hangUp,
  };
}