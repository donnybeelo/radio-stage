import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { ProfileType } from '../screens/ConnectScreen';

// Conditional imports for WebRTC
let WebRTCModules: any = {};
if (Platform.OS !== 'web') {
    try {
        WebRTCModules = require('react-native-webrtc');
    } catch (e) {
        console.warn('react-native-webrtc is not installed. Mobile WebRTC functionality will be disabled.');
    }
}

// Types that work across platforms
type PeerConnectionType = any;
type MediaStreamType = any;

interface CustomSocket {
    send: (data: string) => void;
    close: () => void;
    micEnabled: boolean;
    isConnected: boolean;
}

export const useWebRTC = (serverUrl: string): {
    customSocket: CustomSocket | null;
    connect: (mute: boolean, profileType: ProfileType) => void;
    toggleMic: () => void;
    connectionState: string | null;
} => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [connectionState, setConnectionState] = useState<string | null>(null);
    const mutedRef = useRef(false);
    const peerConnectionRef = useRef<PeerConnectionType | null>(null);
    const clientIdRef = useRef<string | null>(null);
    const localStreamRef = useRef<MediaStreamType | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const profileTypeRef = useRef<ProfileType>("audience");

    // Toggle microphone on/off
    const toggleMic = useCallback(() => {
        if (profileTypeRef.current === "audience") {
            console.log("Audience members cannot toggle microphone.");
            return;
        }

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

    // Get connection state
    useEffect(() => {
        if (peerConnectionRef.current) {
            setConnectionState(peerConnectionRef.current.iceConnectionState);
        }
    }, [peerConnectionRef.current?.iceConnectionState]);

    // Initialize WebRTC connection with the server
    const connect = useCallback((mute: boolean, profileType: ProfileType) => {
        if (isConnected) {
            console.warn("Already connected. Cannot connect again.");
            return;
        }

        profileTypeRef.current = profileType;
        mutedRef.current = mute || profileType === "audience";

        if (!serverUrl) {
            console.error('Server URL is required');
            return;
        }

        // Setup audio context for web
        if (Platform.OS === "web") {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }

        // Setup WebSocket for signaling
        var wsUrl = serverUrl.replace(/^http/, "ws");
        if (!wsUrl.startsWith("ws://")) {
            wsUrl = `ws://${wsUrl}`;
        }
        console.log(`Connecting to: ${wsUrl}`);
        const ws = new WebSocket(`${wsUrl}`);

        // WebRTC configuration
        const configuration = {
            iceServers: [
                { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
            ]
        };

        // Create peer connection
        let peerConnection: PeerConnectionType;
        try {
            if (Platform.OS === 'web') {
                peerConnection = new RTCPeerConnection(configuration);
            } else {
                if (WebRTCModules.RTCPeerConnection) {
                    peerConnection = new WebRTCModules.RTCPeerConnection(configuration);
                } else {
                    throw new Error("RTCPeerConnection is not available on this platform");
                }
            }
        } catch (error) {
            console.error("Error creating PeerConnection:", error);
            return;
        }

        peerConnectionRef.current = peerConnection;

        // Setup local audio stream based on profile type and capture the promise
        const setupPromise = setupLocalAudioStream(peerConnection, profileType);

        // WebSocket event handlers
        ws.onopen = () => {
            console.log("WebSocket connected for signaling");
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
                        console.log("Got client ID:", clientIdRef.current);
                        // ensure local audio tracks are ready before creating offer
                        await setupPromise;
                        createAndSendOffer(peerConnection, ws, profileTypeRef.current);
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
                        console.log("Remote description set");
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
                                console.error("Error adding ICE candidate:", err);
                            }
                        }
                        break;
                    case "error":
                        console.error("Server error:", message.data);
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
            console.log("ICE state:", peerConnection.iceConnectionState);
            if (peerConnection.iceConnectionState === 'connected' ||
                peerConnection.iceConnectionState === 'completed') {
                console.log("WebRTC connection established");
                setIsConnected(true);
            } else if (peerConnection.iceConnectionState === 'disconnected' ||
                peerConnection.iceConnectionState === 'failed') {
                console.log("WebRTC connection failed");
                setIsConnected(false);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: "disconnect",
                        from: clientIdRef.current
                    }));
                }
            }
        };

        interface RTCTrackEvent {
            track: MediaStreamTrack;
            streams: MediaStreamType[];
        }

        // Handle incoming audio tracks
        peerConnection.ontrack = async (event: RTCTrackEvent) => {
            console.log("Received track:", event.track.kind);

            if (event.track.kind === 'audio') {
                try {
                    let mediaStream: MediaStreamType;
                    if (Platform.OS === 'web') {
                        mediaStream = new MediaStream();
                    } else {
                        mediaStream = new WebRTCModules.MediaStream();
                    }

                    mediaStream.addTrack(event.track);

                    // Play audio using appropriate method for platform
                    if (Platform.OS === "web") {
                        const audioContext = audioContextRef.current;
                        if (audioContext) {
                            const source = audioContext.createMediaStreamSource(mediaStream);
                            source.connect(audioContext.destination);
                            console.log("Playing via AudioContext");
                        } else {
                            const audioElement = new window.Audio();
                            audioElement.srcObject = mediaStream;
                            audioElement.autoplay = true;
                            document.body.appendChild(audioElement);
                            console.log("Playing via HTML audio element");
                        }
                    } else {
                        if (sound) {
                            await sound.unloadAsync();
                        }

                        try {
                            const streamUrl = mediaStream.toURL();
                            console.log("Playing stream from:", streamUrl);

                            const { sound: newSound } = await Audio.Sound.createAsync(
                                { uri: streamUrl },
                                { shouldPlay: true, isLooping: false }
                            );

                            setSound(newSound);
                            console.log("Playing via Expo Audio");
                        } catch (error: any) {
                            if (error.message && error.message.includes("FileNotFoundException")) {
                                console.warn("Stream URL may be invalid:", error);
                            } else {
                                console.error("Audio playback error:", error);
                            }
                        }
                    }
                } catch (error: unknown) {
                    console.error("Error playing audio:", error);
                }
            }
        };

        setSocket(ws);

        // Cleanup function
        return () => {
            console.log("Cleaning up WebRTC connection");
            setIsConnected(false);

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

    // Set up local audio stream based on profile type
    const setupLocalAudioStream = async (peerConnection: PeerConnectionType, profileType: ProfileType) => {
        // Audience doesn't need to send audio
        if (profileType === "audience") {
            console.log("Audience profile - no mic access needed");
            localStreamRef.current = null;
            return;
        }

        // Request microphone permission on mobile
        // if (Platform.OS !== 'web') {
        //     const { status } = await Audio.requestPermissionsAsync();
        //     if (status !== 'granted') {
        //         console.log("Microphone permission not granted");
        //         localStreamRef.current = null;
        //         return;
        //     }
        // }

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
                console.log(`Added ${track.kind} track to connection`);
            });

            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !mutedRef.current;
                console.log("Mic initial state:", audioTrack.enabled);
            }
        } catch (error) {
            console.error("Microphone access error:", error);
        }
    };

    // Create and send WebRTC offer to server
    const createAndSendOffer = async (peerConnection: PeerConnectionType, ws: WebSocket, profileType: ProfileType) => {
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
                    sdp: offer.sdp,
                    profileType: profileType // Include profile type in offer
                }
            };

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                console.log(`Sent offer with profile: ${profileType}`);
            }
        } catch (error) {
            console.error("Error creating/sending offer:", error);
        }
    };

    // Custom socket interface for the component
    const customSocket = socket ? {
        ...socket,
        send: (data: string) => {
            if (!isConnected) {
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
            setIsConnected(false);
            socket.close();
        },
        micEnabled: mutedRef.current,
        isConnected: isConnected,
    } : null;

    return { customSocket, connect, toggleMic, connectionState };
};

export default useWebRTC;