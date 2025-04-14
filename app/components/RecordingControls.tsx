import React from "react";
import { View, Button, Text } from "react-native";
import { useWebRTC } from "../hooks/useWebRTC";

interface RecordingControlsProps {
	serverUrl: string;
	onClose?: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
	serverUrl,
	onClose,
}) => {
	const webRTCSocket = useWebRTC(serverUrl);
	const socket = webRTCSocket.customSocket;

	const handleClose = () => {
		socket?.close();
		onClose?.();
	};

	return (
		<View style={{ padding: 16 }}>
			{socket?.isConnected ? (
				<Button
					title={socket?.micEnabled ? "Mute" : "Unmute"}
					onPress={socket?.toggleMic}
				/>
			) : (
				<Button
					title="Connect"
					onPress={() => webRTCSocket.connect()}
					color="#007AFF"
				/>
			)}
			<View style={{ marginTop: 16 }}>
				<Button title="Close" onPress={handleClose} color="#FF3B30" />
			</View>
		</View>
	);
};

export default RecordingControls;
