import React, { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export const useAudioRecording = (socket: WebSocket | null) => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

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

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY,
                async (status) => {
                    if (status.isDoneRecording && socket?.readyState === WebSocket.OPEN) {
                        const uri = await recording.getURI();
                        if (uri) {
                            // socket.send(uri);
                        }
                    }
                },
                100
            );

            setRecording(recording);
        } catch (error) {
            console.error("Failed to start recording:", error);
            Alert.alert("Error", "Failed to start recording");
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

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
            }
        } catch (error) {
            console.error("Failed to stop recording:", error);
            Alert.alert("Error", "Failed to stop recording");
        }
    };

    return { recording, startRecording, stopRecording };
};

export default useAudioRecording;