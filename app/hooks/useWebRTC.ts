import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Conditional imports for WebRTC
let WebRTCModules: any = {};
if (Platform.OS !== 'web') {
    try {
        WebRTCModules = require('react-native-webrtc');
    } catch (e) {
        console.warn('react-native-webrtc is not installed. Mobile WebRTC functionality will be disabled.');
    }
}

// Define types that work across platforms
type PeerConnectionType = any;
type MediaStreamType = any;

interface CustomSocket {
    send: (data: string) => void;
    close: () => void;
    micEnabled: boolean;
    isConnected: boolean;
}

export const useWebRTC = (serverUrl: string): { customSocket: CustomSocket | null; connect: (mute: boolean) => void; toggleMic: () => void } => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const mutedRef = useRef(false);
    const peerConnectionRef = useRef<PeerConnectionType | null>(null);
    const clientIdRef = useRef<string | null>(null);
    const localStreamRef = useRef<MediaStreamType | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const isConnectedRef = useRef<boolean>(false);

    const toggleMic = useCallback(() => {
        mutedRef.current = !mutedRef.current;
        const localStream = localStreamRef.current;
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !mutedRef.current;
                console.log("Microphone state applied:", audioTrack.enabled);
            }
        }
    }, []);

    const connect = useCallback((mute: boolean) => {
        if (isConnectedRef.current) {
            console.warn("Already connected. Cannot connect again.");
            return;
        }

        mutedRef.current = mute;

        if (!serverUrl) {
            console.error('Server URL is required');
            return;
        }

        // Setup audio context for web playback
        if (Platform.OS === "web") {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }

        // Setup WebSocket for signaling
        var wsUrl = serverUrl.replace(/^http/, "ws");
        if (!wsUrl.startsWith("ws://")) {
            wsUrl = `ws://${wsUrl}`;
        }
        const ws = new WebSocket(`${wsUrl}`);

        // WebRTC configuration
        const configuration = {
            iceServers: [
                { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
            ]
        };

        // Create RTCPeerConnection based on platform
        let peerConnection: PeerConnectionType;
        if (Platform.OS === 'web') {
            peerConnection = new RTCPeerConnection(configuration);
        } else {
            if (WebRTCModules.RTCPeerConnection) {
                peerConnection = new WebRTCModules.RTCPeerConnection(configuration);
            } else {
                console.error("RTCPeerConnection is not available on this platform");
                return;
            }
        }

        peerConnectionRef.current = peerConnection;

        // Setup local audio stream
        setupLocalAudioStream(peerConnection);

        // WebSocket event handlers
        ws.onopen = () => {
            console.log("Connected to WebSocket for signaling");
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        ws.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);

                switch (message.type) {
                    case "client-id":
                        clientIdRef.current = message.data;
                        console.log("Received client ID:", clientIdRef.current);
                        createAndSendOffer(peerConnection, ws);
                        break;

                    case "answer":
                        let answerDesc;
                        if (Platform.OS === 'web') {
                            answerDesc = new RTCSessionDescription({
                                type: message.data.type,
                                sdp: message.data.sdp
                            });
                        } else {
                            answerDesc = new WebRTCModules.RTCSessionDescription({
                                type: message.data.type,
                                sdp: message.data.sdp
                            });
                        }

                        await peerConnection.setRemoteDescription(answerDesc);
                        console.log("Remote description set successfully");
                        isConnectedRef.current = true;
                        break;

                    case "ice-candidate":
                        if (message.data && message.data.candidate) {
                            try {
                                let candidate;
                                if (Platform.OS === 'web') {
                                    candidate = new RTCIceCandidate({
                                        candidate: message.data.candidate,
                                        sdpMid: message.data.sdpMid,
                                        sdpMLineIndex: message.data.sdpMLineIndex
                                    });
                                } else {
                                    candidate = new WebRTCModules.RTCIceCandidate({
                                        candidate: message.data.candidate,
                                        sdpMid: message.data.sdpMid,
                                        sdpMLineIndex: message.data.sdpMLineIndex
                                    });
                                }

                                await peerConnection.addIceCandidate(candidate);
                            } catch (err) {
                                console.error("Error adding received ICE candidate:", err);
                            }
                        }
                        break;
                }
            } catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        };

        // WebRTC event handlers
        interface RTCIceCandidateEvent {
            candidate: {
                candidate: string;
                sdpMid: string | null;
                sdpMLineIndex: number | null;
            } | null;
        }

        peerConnection.onicecandidate = (event: RTCIceCandidateEvent) => {
            if (event.candidate) {
                const message = {
                    type: "ice-candidate",
                    from: clientIdRef.current,
                    data: {
                        candidate: event.candidate.candidate,
                        sdpMid: event.candidate.sdpMid,
                        sdpMLineIndex: event.candidate.sdpMLineIndex
                    }
                };

                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message));
                }
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", peerConnection.iceConnectionState);
            if (peerConnection.iceConnectionState === 'connected' ||
                peerConnection.iceConnectionState === 'completed') {
                console.log("WebRTC connection established");
            }
        };

        interface RTCTrackEvent {
            track: MediaStreamTrack;
            streams: MediaStreamType[];
        }

        peerConnection.ontrack = async (event: RTCTrackEvent) => {
            console.log("Received remote track:", event.track.kind);

            if (event.track.kind === 'audio') {
                try {
                    let mediaStream: MediaStreamType;
                    if (Platform.OS === 'web') {
                        mediaStream = new MediaStream();
                    } else {
                        mediaStream = new WebRTCModules.MediaStream();
                    }

                    mediaStream.addTrack(event.track);

                    if (Platform.OS === "web") {
                        const audioContext: AudioContext | null = audioContextRef.current;
                        if (audioContext) {
                            const source: MediaStreamAudioSourceNode = audioContext.createMediaStreamSource(mediaStream);
                            source.connect(audioContext.destination);
                            console.log("Playing continuous audio via AudioContext");
                        } else {
                            const audioElement: HTMLAudioElement = new window.Audio();
                            audioElement.srcObject = mediaStream;
                            audioElement.autoplay = true;
                            document.body.appendChild(audioElement);
                            console.log("Playing audio via HTML audio element");
                        }
                    } else {
                        if (sound) {
                            await sound.unloadAsync();
                        }

                        interface AudioPlaybackStatus {
                            sound: Audio.Sound;
                            status: {
                                isLoaded: boolean;
                                [key: string]: any;
                            };
                        }

                        try {
                            const streamUrl = mediaStream.toURL();
                            console.log("Attempting to play stream from URL:", streamUrl);

                            const { sound: newSound }: AudioPlaybackStatus = await Audio.Sound.createAsync(
                                { uri: streamUrl },
                                { shouldPlay: true, isLooping: false }
                            );

                            setSound(newSound);
                            console.log("Playing audio via Expo Audio");
                        } catch (error: any) {
                            if (error.message && error.message.includes("FileNotFoundException")) {
                                console.warn("File not found for audio playback. Stream URL may be invalid or cleaned up:", error);
                            } else {
                                console.error("Unexpected error during audio playback:", error);
                            }
                        }
                    }
                } catch (error: unknown) {
                    console.error("Error playing received audio:", error);
                }
            }
        };

        setSocket(ws);

        // Clean up function
        return () => {
            console.log("Cleaning up WebRTC and WebSocket connections");
            isConnectedRef.current = false;

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: "disconnect",
                    from: clientIdRef.current
                }));
            }

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }

            if (audioContextRef.current) {
                audioContextRef.current.close();
            }

            ws.close();

            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [serverUrl]);

    // Setup local audio stream and add to peer connection
    const setupLocalAudioStream = async (peerConnection: PeerConnectionType) => {
        try {
            let stream;
            if (Platform.OS === 'web') {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } else {
                stream = await WebRTCModules.mediaDevices.getUserMedia({ audio: true, video: false });
            }

            localStreamRef.current = stream;

            stream.getTracks().forEach((track: any) => {
                peerConnection.addTrack(track, stream);
                console.log(`Added local ${track.kind} track to peer connection`);
            });

            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !mutedRef.current;
                console.log("Microphone state applied:", audioTrack.enabled);
            }
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    // Create and send offer
    const createAndSendOffer = async (peerConnection: PeerConnectionType, ws: WebSocket) => {
        try {
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false
            });

            await peerConnection.setLocalDescription(offer);

            const message = {
                type: "offer",
                from: clientIdRef.current,
                data: {
                    type: offer.type,
                    sdp: offer.sdp
                }
            };

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                console.log("Offer sent to server");
            }
        } catch (error) {
            console.error("Error creating or sending offer:", error);
        }
    };

    // Custom socket implementation
    const customSocket = socket ? {
        ...socket,
        send: (data: string) => {
            if (!isConnectedRef.current) {
                socket.send(data);
            }
        },
        close: () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }

            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }

            socket.close();
        },
        micEnabled: mutedRef.current,
        isConnected: isConnectedRef.current,
    } : null;

    return { customSocket, connect, toggleMic };
};

export default useWebRTC;