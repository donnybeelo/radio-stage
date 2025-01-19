import React, { useEffect, useRef, useState } from "react";
import { Text, View, Button } from "react-native";

export default function Index() {
	const [serverState, setServerState] = useState("Disconnected");
	const ws = useRef<WebSocket | null>(null);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const [buffers, setBuffers] = useState<Uint8Array[]>([]);
	const [isPlaying, setIsPlaying] = useState(false);
	const [audioPlaying, setAudioPlaying] = useState<HTMLAudioElement | null>(null);
	const [urlQueue, setUrlQueue] = useState<string[]>([]);

	const openWebSocket = () => {
		ws.current = new WebSocket("ws://localhost:8080/ws");
		ws.current.onopen = () => {
			setServerState("Connected to the server");
			startRecording();
		};
		ws.current.onclose = () => {
			setServerState("Disconnected. Check internet or server.");
			stopRecording();
		};
		ws.current.onerror = () => {
			setServerState("An error occurred");
			stopRecording();
		};
		ws.current.onmessage = (event) => {
			handleMessage(event);
		};
	};

	const startRecording = async () => {
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
		mediaRecorder.current.start(100); // Send data in chunks every 100ms
	};

	const stopRecording = () => {
		if (mediaRecorder.current) {
			mediaRecorder.current.stop();
			mediaRecorder.current = null;
		}
	};

	const handleMessage = (event: MessageEvent) => {
		const message = JSON.parse(event.data);
		if (message?.event === "media") {
			const mediaPayload = message.media.payload;
			setBuffers((prevBuffers) => [...prevBuffers, mediaPayload?.data]);
		}
	};

	useEffect(() => {
		if (buffers.length > 0) {
			const audioData = buffers.flat().map((buffer) => new Uint8Array(buffer.buffer));
			const blob = new Blob(audioData, { type: "audio/mpeg" });
			const url = window.URL.createObjectURL(blob);
			setUrlQueue((prevUrlQueue) => [...prevUrlQueue, url]);
			setBuffers([]);
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

	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
			}}
		>
			<Button onPress={openWebSocket} title={"Open WebSocket"} />
			<Button onPress={stopRecording} title={"Stop Recording"} />
			<Text>{serverState}</Text>
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
				></View>
			</View>
		</View>
	);
}
