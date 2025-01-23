import React, { useEffect, useRef, useState } from "react";
import { Text, View, Button, Platform } from "react-native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";

export default function Index() {
	const [serverState, setServerState] = useState("Disconnected");
	const ws = useRef<WebSocket | null>(null);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const [buffers, setBuffers] = useState<Blob[]>([]);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [audioPlaying, setAudioPlaying] = useState<HTMLAudioElement | null>(
		null
	);
	const [urlQueue, setUrlQueue] = useState<string[]>([]);

	const requestMicrophonePermission = async () => {
		if (Platform.OS === "android") {
			const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
			return result === RESULTS.GRANTED;
		} else if (Platform.OS === "ios") {
			const result = await request(PERMISSIONS.IOS.MICROPHONE);
			return result === RESULTS.GRANTED;
		}
		return true; // Assume permission is granted on web
	};

	const openWebSocket = async () => {
		const hasPermission = await requestMicrophonePermission();
		if (!hasPermission) {
			setServerState("Microphone permission denied");
			return;
		}

		ws.current = new WebSocket("ws://34.148.167.222:8080/ws");
		ws.current.onopen = () => {
			setServerState("Connected to the server");
		};
		ws.current.onclose = () => {
			setServerState("Disconnected. Check internet or server.");
			stopRecording();
			ws.current = null;
		};
		ws.current.onerror = () => {
			setServerState("An error occurred");
			stopRecording();
			ws.current = null;
		};
		ws.current.onmessage = (event) => {
			handleMessage(event);
		};
	};

	const startRecording = async () => {
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("getUserMedia is not supported in this browser");
			}
			if (!ws.current) {
				console.error("WebSocket connection not open");
				return;
			}
			// ws.current?.send("Begin recording");
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder.current = new MediaRecorder(stream);
			mediaRecorder.current.ondataavailable = (event) => {
				if (
					event.data.size > 0 &&
					ws.current &&
					ws.current.readyState === WebSocket.OPEN
				) {
					ws.current.send(event.data);
				}
			};
			setIsRecording(true);
			mediaRecorder.current.start(100); // Send data in chunks every 100ms
		} catch (error) {
			console.error("Error accessing microphone", error);
			setServerState("Error accessing microphone");
		}
	};

	const stopRecording = () => {
		if (mediaRecorder.current) {
			// ws.current?.send("Stop recording");
			setIsRecording(false);
			mediaRecorder.current.stop();
			mediaRecorder.current = null;
		}
	};

	const handleMessage = (event: MessageEvent) => {
		const blob = new Blob(event.data, { type: "audio/mpeg" });
		setBuffers((prevBuffers) => [...prevBuffers, blob]);
	};

	useEffect(() => {
		if (buffers.length > 0) {
			const url = window.URL.createObjectURL(buffers[0]);
			setUrlQueue((prevUrlQueue) => [...prevUrlQueue, url]);
			setBuffers((prevBuffers) => prevBuffers.slice(1));
		}
	}, [buffers]);

	useEffect(() => {
		const playNAudio = async () => {
			const nextUrl = urlQueue[0];
			try {
				if (urlQueue.length) {
					const audio = new Audio();
					setAudioPlaying(audio);

					audio.src = nextUrl;
					audio.autoplay = true;
					audio.preload = "auto";
					setIsPlaying(true);
					audio.onended = () => {
						setIsPlaying(false);
						setUrlQueue((prevQ) => prevQ.slice(1));
					};
				}
			} catch (error) {
				console.error("Error playing Mp3 audio:", error);
			}
		};
		if (!isPlaying && urlQueue.length > 0) {
			playNAudio();
		}
	}, [urlQueue, isPlaying]);

	useEffect(() => {
		return () => {
			if (ws.current) {
				ws.current.close();
			}
			stopRecording();
		};
	}, []);

	const Buttons = () => {
		return (
			<>
				{!ws.current && (
					<Button onPress={openWebSocket} title={"Open WebSocket"} />
				)}
				{ws.current && (
					<>
						<Button onPress={startRecording} title={"Start Recording"} />
						<Button onPress={stopRecording} title={"Stop Recording"} />
						<View
							style={{
								width: 20,
								height: 20,
								borderRadius: 10,
								backgroundColor: isRecording ? "red" : "transparent",
								borderWidth: 2,
								borderColor: "black",
								marginTop: 10,
							}}
						/>
					</>
				)}
			</>
		);
	};

	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
			}}
		>
			<View
				style={{
					backgroundColor: "lightblue",
					padding: 10,
					margin: 10,
					width: "80%",
					height: 250,
					borderRadius: 10,
				}}
			>
				<View
					style={{
						backgroundColor: "white",
						padding: 2,
						margin: 2,
						width: "auto",
						height: "auto",
						marginBottom: 50,
						alignItems: "center",
						flex: 1,
						borderRadius: 10,
					}}
				>
					<Buttons />
					<Text>{serverState}</Text>
				</View>
			</View>
		</View>
	);
}
