import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWebRTC } from "../hooks/useWebRTC";
import styles from "../styles/StageList.styles";
import PillButton from "./PillButton";

interface RecordingControlsProps {
	serverUrl: string;
	onClose?: () => void;
	name?: string;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
	serverUrl,
	onClose,
	name,
}) => {
	const webRTCSocket = useWebRTC(serverUrl);
	const socket = webRTCSocket.customSocket;
	const [connectText, setConnectText] = React.useState("Connect");
	const [muted, setMuted] = React.useState(false);

	const handleToggleMic = () => {
		if (socket?.isConnected) {
			webRTCSocket.toggleMic();
			setMuted((prev) => !prev);
		} else {
			setMuted((prev) => !prev);
		}
	};

	const handleClose = () => {
		setConnectText("Connect");
		socket?.close();
		onClose?.();
	};
	const handleConnect = () => {
		webRTCSocket.connect(muted);
		setConnectText("Connecting...");
	};

	return (
		<View style={styles.container}>
			<Text style={styles.modalTitle}>{name}</Text>
			<PillButton
				style={styles.closeButton}
				onPress={handleClose}
				icon="close"
			/>
			<View style={styles.buttonRow}>
				{!socket?.isConnected && (
					<PillButton
						style={[styles.connectButton]}
						onPress={handleConnect}
						icon="radio"
						text={connectText}
					/>
				)}
				<PillButton
					style={[muted ? styles.unmuteButton : styles.muteButton]}
					onPress={handleToggleMic}
					icon={muted ? "mic-off" : "mic"}
				/>
			</View>
		</View>
	);
};

export default RecordingControls;
