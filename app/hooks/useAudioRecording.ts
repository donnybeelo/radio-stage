import React, { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export const useAudioRecording = (socket: WebSocket | null) => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const startRecording = async () => {
        try {
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            recordLoop();

        } catch (error) {
            console.error("Failed to start recording:", error);
            Alert.alert("Error", "Failed to start recording");
        }
    };

    const recordLoop = async () => {
        const recording = new Audio.Recording();
        recordingRef.current = recording; // Store in ref for reliable access
        setRecording(recording);

        try {
            await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        } catch (error) {
            console.error("Failed to prepare recording:", error);
            Alert.alert("Error", "Failed to prepare recording");
            return;
        }

        await recording.startAsync();

        console.log('Recording started');
        setTimeout(() => {
            stopRecording(false);
        }, 1000); // Stop recording after 0.5 seconds
    }

    // Function to stop recording and send audio data

    const stopRecording = async (stop: boolean = true) => {
        if (!recordingRef.current) {
            console.log("No recording in progress");
            return;
        }

        try {
            const currentRecording = recordingRef.current;
            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();

            recordingRef.current = null;
            if (!stop) {
                console.log("Recording restarting");
                recordLoop();
            }
            else setRecording(null);

            if (uri && socket?.readyState === WebSocket.OPEN) {
                if (Platform.OS === "web") {
                    const response = await fetch(uri);
                    const blob = await response.blob();

                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                        const base64data = reader.result?.toString().split(",")[1];
                        if (base64data && socket.readyState === WebSocket.OPEN) {
                            socket.send(base64data);
                        }
                    };
                } else {
                    const fileData = await FileSystem.readAsStringAsync(uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    socket.send(fileData);
                }
                console.log("Audio sent to server");
            }
        } catch (error) {
            console.error("Failed to stop recording:", error);
            Alert.alert("Error", "Failed to stop recording");
        }
    };

    return { recording, startRecording, stopRecording };
};

export default useAudioRecording;