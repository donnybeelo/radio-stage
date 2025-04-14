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

	const handleClose = () => {
		socket?.close();
		onClose?.();
	};

	return (
		<View style={styles.container}>
				<Text style={styles.modalTitle}>{name}</Text>
				<TouchableOpacity style={styles.closeButton} onPress={handleClose}>
					<Ionicons name="close" size={24} color="#fff" />
				</TouchableOpacity>
			<View style={styles.buttonRow}>
				{socket?.isConnected ? (
					<TouchableOpacity
						style={[
							styles.circleButton,
							socket?.micEnabled ? styles.muteButton : styles.unmuteButton,
						]}
						onPress={socket?.toggleMic}
					>
						<Ionicons
							name={socket?.micEnabled ? "mic" : "mic-off"}
							size={24}
							color="#fff"
						/>
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={[styles.circleButton, styles.connectButton]}
						onPress={() => webRTCSocket.connect()}
					>
						<Ionicons name="radio" size={24} color="#fff" />
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

export default RecordingControls;
