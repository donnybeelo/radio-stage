import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	stageItem: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	modalContainer: {
		flex: 1,
		paddingHorizontal: 20,
		justifyContent: "flex-end",
		margin: 0,
		height: "100%",
	},
	modalContent: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 20,
		minHeight: 150,
		elevation: 5,
		boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		maxWidth: 400,
	},
	modalButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 15,
		textAlign: "center",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ddd",
		padding: 10,
		marginBottom: 15,
		borderRadius: 5,
	},
	stageName: {
		fontSize: 16,
		fontWeight: "500",
	},
	stageInfo: {
		fontSize: 12,
		color: "#666",
		marginTop: 4,
	},
	createStage: {
		position: "absolute",
		right: 20,
		bottom: 20,
	},
	destructiveButton: {
		height: 40,
		marginRight: 10,
		justifyContent: "center",
		backgroundColor: "#FF0000",
	},
	connectButton: {
		backgroundColor: "#007AFF",
	},
	disconnectButton: {
		backgroundColor: "#FF3B30",
	},
	muteButton: {
		backgroundColor: "#FF9500",
	},
	unmuteButton: {
		backgroundColor: "#34C759",
	},
	closeButton: {
		position: "absolute",
		top: 0,
		right: 0,
		backgroundColor: "#FF3B30",
		borderRadius: 16,
		paddingHorizontal: "auto",
		width: 32,
		height: 32,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 16,
	},
});

export default styles;