import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWebRTC } from "../hooks/useWebRTC";
import styles from "../styles/StageList.styles";
import PillButton from "./PillButton";
import { ProfileType } from "../screens/ConnectScreen";

interface RecordingControlsProps {
	serverUrl: string;
	onClose?: () => void;
	name?: string;
	profileType: ProfileType;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
	serverUrl,
	onClose,
	name,
	profileType,
}) => {
	const webRTCSocket = useWebRTC(serverUrl);
	const socket = webRTCSocket.customSocket;
	const [muted, setMuted] = React.useState(profileType === "audience");
	const [connecting, setConnecting] = React.useState(false);

	const handleToggleMic = () => {
		// Audience can't unmute
		if (profileType === "audience") {
			console.log("Audience cannot unmute.");
			return;
		}

		if (socket?.isConnected) {
			webRTCSocket.toggleMic();
			setMuted((prev) => !prev);
		} else {
			setMuted((prev) => !prev);
		}
	};

	const handleConnect = () => {
		webRTCSocket.connect(muted, profileType);
		setConnecting(true);
	};

	const handleDisconnect = () => {
		socket?.close();
		setConnecting(false);
	};

	return (
		<View style={{ flex: 1 }}>
			<Text style={styles.modalTitle}>{name}</Text>

			{/* Close button only when not connected */}
			{!socket?.isConnected && (
				<PillButton
					style={styles.closeButton}
					onPress={onClose!}
					icon="close"
				/>
			)}

			<View style={styles.buttonRow}>
				{/* Connect/Disconnect button */}
				<PillButton
					style={[
						socket?.isConnected
							? styles.disconnectButton
							: styles.connectButton,
					]}
					onPress={socket?.isConnected ? handleDisconnect : handleConnect}
					icon={socket?.isConnected ? "close-circle" : "radio"}
					text={
						socket?.isConnected
							? "Disconnect"
							: connecting
								? "Connecting..."
								: "Connect"
					}
					disabled={!socket?.isConnected && connecting}
				/>

				{/* Mic toggle - only for non-audience */}
				{profileType !== "audience" && (
					<PillButton
						style={[
							muted ? styles.unmuteButton : styles.muteButton,
						]}
						onPress={handleToggleMic}
						icon={muted ? "mic-off" : "mic"}
					/>
				)}
			</View>
		</View>
	);
};

export default RecordingControls;
