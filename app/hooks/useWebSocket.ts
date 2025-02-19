import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export const useWebSocket = (serverUrl: string) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    useEffect(() => {
        const wsUrl = serverUrl.replace(/^http/, "ws");
        const ws = new WebSocket(`${wsUrl}/ws`);

        ws.onopen = () => {
            console.log("Connected to WebSocket");
        };

        ws.onmessage = async (event) => {
            try {
                const audioData = event.data;

                if (Platform.OS === "web") {
                    const byteCharacters = atob(audioData);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const audioBlob = new Blob([byteArray], { type: "audio/wav" });
                    const uri = URL.createObjectURL(audioBlob);
                    const { sound: newSound } = await Audio.Sound.createAsync(
                        { uri },
                        { shouldPlay: true }
                    );
                    setSound(newSound);
                } else {
                    const tempFilePath = `${FileSystem.cacheDirectory}temp_audio.wav`;
                    await FileSystem.writeAsStringAsync(tempFilePath, audioData, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const { sound: newSound } = await Audio.Sound.createAsync(
                        { uri: tempFilePath },
                        { shouldPlay: true }
                    );
                    setSound(newSound);
                }
            } catch (error) {
                console.error("Error playing received audio:", error);
            }
        };

        setSocket(ws);

        return () => {
            ws.close();
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [serverUrl]);

    return socket;
};
