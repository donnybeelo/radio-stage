import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	Button: {
		borderRadius: 20,
	},
	stageItem: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0)",
	},
	modalContainer: {
		flex: 1,
		paddingHorizontal: 20,
		justifyContent: "flex-end",
		margin: 0,
	},
	modalContent: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 20,
		elevation: 5,
		boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
		maxWidth: 400,
	},
	button: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 5,
		minWidth: 100,
		backgroundColor: "#ccc",
	},
	buttonPrimary: {
		backgroundColor: "#007AFF",
	},
	buttonDisabled: {
		backgroundColor: "#cccccc",
		opacity: 0.7,
	},
	buttonText: {
		color: "#fff",
		textAlign: "center",
		fontSize: 16,
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
	fab: {
		position: "absolute",
		right: 20,
		bottom: 20,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: "#007AFF",
		justifyContent: "center",
		alignItems: "center",
		elevation: 4,
		boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
	},
	leaveFab: {
		width: 40,
		height: 40,
		borderRadius: 28,
		marginRight: 10,
		backgroundColor: "#FF0000",
		justifyContent: "center",
		alignItems: "center",
		elevation: 4,
		boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
	},
	pillText: {
		color: "#fff",
		fontSize: 16,
		marginLeft: 10,
		textTransform: "uppercase",
	},
	leaveButton: {
		marginTop: 10,
		padding: 10,
		backgroundColor: "#FF3B30",
		borderRadius: 5,
		alignItems: "center",
	},
	leaveButtonText: {
		color: "#007AFF", // Match the title bar color
		fontSize: 16,
		fontWeight: "bold",
		marginRight: 10, // Add some margin for spacing
	},
	connectButton: {
		backgroundColor: "#007AFF",
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
	circleButton: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		marginHorizontal: 8,
	},
	pillButton: {
		width: "auto",
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		flexDirection: "row",
		paddingHorizontal: 14,
		marginHorizontal: 8,

	},
});

export default styles;