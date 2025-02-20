import React from "react";
import { View, Button } from "react-native";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { useWebSocket } from "../hooks/useWebSocket";

interface RecordingControlsProps {
	serverUrl: string;
	onClose?: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
	serverUrl,
	onClose,
}) => {
	const socket = useWebSocket(serverUrl);
	const { recording, startRecording, stopRecording } =
		useAudioRecording(socket);

	const handleClose = () => {
		if (recording) {
			stopRecording();
		}
		socket?.close();
		onClose?.();
	};

	return (
		<View style={{ padding: 16 }}>
			<Button
				title={recording ? "Stop Recording" : "Start Recording"}
				onPress={recording ? stopRecording : startRecording}
			/>
			<View style={{ marginTop: 16 }}>
				<Button title="Close" onPress={handleClose} color="#FF3B30" />
			</View>
		</View>
	);
};

export default RecordingControls;
