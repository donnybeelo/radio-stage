import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
	fabText: {
		color: "#fff",
		fontSize: 24,
	},
});
