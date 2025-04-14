import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWebRTC } from "../hooks/useWebRTC";
import styles from "../styles/StageList.styles";

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
			<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
				<Ionicons name="close" size={24} color="#fff" />
			</TouchableOpacity>
			<View style={styles.buttonRow}>
				{!socket?.isConnected && (
					<TouchableOpacity
						style={[styles.pillButton, styles.connectButton]}
						onPress={handleConnect}
					>
						<Ionicons name="radio" size={24} color="#fff" />
						<Text style={styles.pillText}>{connectText}</Text>
					</TouchableOpacity>
				)}
				<TouchableOpacity
					style={[
						styles.circleButton,
						muted ? styles.unmuteButton : styles.muteButton,
					]}
					onPress={handleToggleMic}
				>
					<Ionicons name={muted ? "mic-off" : "mic"} size={24} color="#fff" />
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default RecordingControls;
