import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Conditional imports for WebRTC
let WebRTCModules: any = {};
if (Platform.OS !== 'web') {
    // Import for React Native
    try {
        WebRTCModules = require('react-native-webrtc');
    } catch (e) {
        console.warn('react-native-webrtc is not installed. Mobile WebRTC functionality will be disabled.');
    }
}

// Define types that work across platforms
type PeerConnectionType = any; // RTCPeerConnection
type SessionDescriptionType = any; // RTCSessionDescription
type IceCandidateType = any; // RTCIceCandidate
type MediaStreamType = any; // MediaStream

interface SignalingMessage {
    type: string;
    from: string;
    to?: string;
    data: any;
}

export const useWebSocket = (serverUrl: string) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const peerConnectionRef = useRef<PeerConnectionType | null>(null);
    const clientIdRef = useRef<string | null>(null);
    const localStreamRef = useRef<MediaStreamType | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const isConnectedRef = useRef<boolean>(false);

    useEffect(() => {
        if (!serverUrl) {
            console.error('Server URL is required');
            return;
        }

        // Setup audio context for continuous playback
        if (Platform.OS === "web") {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }

        // Setup WebSocket for signaling (keeping the same URL format for compatibility)
        var wsUrl = serverUrl.replace(/^http/, "ws");
        if (!wsUrl.startsWith("ws://")) {
            wsUrl = `ws://${wsUrl}`;
        }
        const ws = new WebSocket(`${wsUrl}`);

        // Setup WebRTC configuration
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
            // Mobile implementation
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

        // WebSocket event handlers for signaling
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
                        // Store client ID assigned by server
                        clientIdRef.current = message.data;
                        console.log("Received client ID:", clientIdRef.current);

                        // After getting client ID, create and send offer
                        createAndSendOffer(peerConnection, ws);
                        break;

                    case "answer":
                        // Set remote description using platform-specific SessionDescription
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
                        // Add ICE candidate using platform-specific IceCandidate
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
        // Define interfaces for WebRTC event and ICE candidate
        interface RTCIceCandidateEvent {
            candidate: {
            candidate: string;
            sdpMid: string | null;
            sdpMLineIndex: number | null;
            } | null;
        }

        interface IceCandidateMessage {
            type: string;
            from: string | null;
            data: {
            candidate: string;
            sdpMid: string | null;
            sdpMLineIndex: number | null;
            };
        }

        peerConnection.onicecandidate = (event: RTCIceCandidateEvent) => {
            if (event.candidate) {
            // Send ICE candidate to server
            const message: IceCandidateMessage = {
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

        // Define interfaces for track event
        interface RTCTrackEvent {
            track: MediaStreamTrack;
            streams: MediaStreamType[];
        }

        peerConnection.ontrack = async (event: RTCTrackEvent) => {
            console.log("Received remote track:", event.track.kind);

            if (event.track.kind === 'audio') {
            try {
                // Create MediaStream based on platform
                let mediaStream: MediaStreamType;
                if (Platform.OS === 'web') {
                mediaStream = new MediaStream();
                } else {
                mediaStream = new WebRTCModules.MediaStream();
                }

                mediaStream.addTrack(event.track);

                if (Platform.OS === "web") {
                // Connect remote audio stream to audio context for continuous playback
                const audioContext: AudioContext | null = audioContextRef.current;
                if (audioContext) {
                    const source: MediaStreamAudioSourceNode = audioContext.createMediaStreamSource(mediaStream);
                    source.connect(audioContext.destination);
                    console.log("Playing continuous audio via AudioContext");
                } else {
                    // Fallback to audio element
                    const audioElement: HTMLAudioElement = new window.Audio();
                    audioElement.srcObject = mediaStream;
                    audioElement.autoplay = true;
                    document.body.appendChild(audioElement);
                    console.log("Playing audio via HTML audio element");
                }
                } else {
                // For mobile, use Expo's Audio API
                // We need to ensure sound is played continuously
                // and can handle new incoming streams

                // Unload previous sound if it exists
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

                const { sound: newSound }: AudioPlaybackStatus = await Audio.Sound.createAsync(
                    { uri: mediaStream.toURL() },
                    { shouldPlay: true, isLooping: false }
                );

                setSound(newSound);
                console.log("Playing audio via Expo Audio");
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

            // Send disconnect message before closing
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: "disconnect",
                    from: clientIdRef.current
                }));
            }

            // Stop local stream tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }

            // Close WebRTC connection
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }

            // Close audio context
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }

            // Close WebSocket connection
            ws.close();

            // Unload audio
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [serverUrl]);

    // Setup local audio stream and add to peer connection
    const setupLocalAudioStream = async (peerConnection: PeerConnectionType) => {
        try {
            // Request microphone access based on platform
            let stream;
            if (Platform.OS === 'web') {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            } else {
                stream = await WebRTCModules.mediaDevices.getUserMedia({ audio: true, video: false });
            }

            localStreamRef.current = stream;

            // Add all tracks to the peer connection
            stream.getTracks().forEach((track: any) => {
                peerConnection.addTrack(track, stream);
                console.log(`Added local ${track.kind} track to peer connection`);
            });
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    // Helper function to create and send offer
    const createAndSendOffer = async (peerConnection: PeerConnectionType, ws: WebSocket) => {
        try {
            // Create offer with audio
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: false
            });

            await peerConnection.setLocalDescription(offer);

            // Send offer to server
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

    // Add a custom send method to maintain compatibility with existing code
    const customSocket = socket ? {
        ...socket,
        send: (data: string) => {
            // If WebRTC is connected, we don't need to send audio data via WebSocket
            // as it's already being sent via the audio track
            if (!isConnectedRef.current) {
                socket.send(data);
            }
        },
        close: () => {
            // Stop local stream tracks before closing
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }

            // Close WebRTC connection
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }

            socket.close();
        }
    } : null;

    // Return modified socket with WebRTC capabilities
    return customSocket;
};

export default useWebSocket;