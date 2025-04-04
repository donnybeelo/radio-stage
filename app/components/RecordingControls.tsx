import React from "react";
import { View, Button } from "react-native";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { useWebRTC } from "../hooks/useWebRTC";

interface RecordingControlsProps {
	serverUrl: string;
	onClose?: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
	serverUrl,
	onClose,
}) => {
	const socket = useWebRTC(serverUrl);
	const { recording, startRecording, stopRecording } =
		useAudioRecording(socket);

	const handleClose = () => {
		if (recording) {
			stopRecording();
		}
		socket?.close();
		onClose?.();
	};

	const handleRecordingPress = () => {
		if (recording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	return (
		<View style={{ padding: 16 }}>
			<Button
				title={recording ? "Stop Recording" : "Start Recording"}
				onPress={handleRecordingPress}
			/>
			<View style={{ marginTop: 16 }}>
				<Button title="Close" onPress={handleClose} color="#FF3B30" />
			</View>
		</View>
	);
};

export default RecordingControls;
