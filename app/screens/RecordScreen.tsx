import React from "react";
import { View, Button } from "react-native";
import { useAudioRecording } from "../hooks/useAudioRecording";
import { useWebSocket } from "../hooks/useWebSocket";

interface RecordScreenProps {
	serverUrl: string;
}

const RecordScreen: React.FC<RecordScreenProps> = ({ serverUrl }) => {
	const socket = useWebSocket(serverUrl);
	const { recording, startRecording, stopRecording } =
		useAudioRecording(socket);

	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<Button
				title={recording ? "Stop Recording" : "Start Recording"}
				onPress={recording ? stopRecording : startRecording}
			/>
		</View>
	);
};

export default RecordScreen;
