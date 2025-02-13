import React, { useEffect, useState } from "react";
import { View, Button, Alert, Platform, Text } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const App = () => {
	const [recording, setRecording] = useState<Audio.Recording | null>(null);
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [sound, setSound] = useState<Audio.Sound | null>(null);

	useEffect(() => {
		// Initialize WebSocket connection
		const ws = new WebSocket("ws://34.148.167.222:8080/ws");

		ws.onopen = () => {
			console.log("Connected to WebSocket");
		};

		ws.onmessage = async (event) => {
			try {
				const audioData = event.data;

				if (Platform.OS === "web") {
					// Web implementation using Blob
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
					// Native implementation using temporary file
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
	}, []);

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
						// Send audio data to WebSocket server
						const uri = await recording.getURI();
						if (uri) {
							// socket.send(uri);
						}
					}
				},
				100 // Update interval in milliseconds
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
					// For web, we need to handle the blob directly
					const response = await fetch(uri);
					const blob = await response.blob();

					// Convert blob to base64
					const reader = new FileReader();
					reader.readAsDataURL(blob);
					reader.onloadend = function () {
						const base64data = reader.result?.toString().split(",")[1];
						if (base64data && socket.readyState === WebSocket.OPEN) {
							socket.send(base64data);
						}
					};
				} else {
					// For native platforms, use FileSystem
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

	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<Button
				title={recording ? "Stop Recording" : "Start Recording"}
				onPress={recording ? stopRecording : startRecording}
			/>
		</View>
	);
};

export default App;
