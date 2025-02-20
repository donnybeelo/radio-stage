import React, { useEffect, useState } from "react";
import {
	View,
	FlatList,
	TouchableOpacity,
	Text,
	StyleSheet,
	Modal,
	TextInput,
	Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RecordingControls from "../components/RecordingControls";
import { Stage, StageListItem, StageResponse } from "../types/Stage";

interface StageListProps {
	serverUrl: string;
}

const StageList: React.FC<StageListProps> = ({ serverUrl }) => {
	const [stages, setStages] = useState<Stage[]>([]);
	const [selectedStage, setSelectedStage] = useState<StageListItem | null>(
		null
	);
	const [isCreateModalVisible, setCreateModalVisible] = useState(false);
	const [newStageName, setNewStageName] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		fetchStages();
	}, []);

	const fetchStages = async () => {
		try {
			const response = await fetch(`${serverUrl}/api/`);
			const data: StageResponse = await response.json();
			if (data.status === "success") {
				setStages(data.data);
			} else {
				console.error("Failed to fetch stages:", data.message);
			}
		} catch (error) {
			console.error("Failed to fetch stages:", error);
		}
	};

	const handleStageSelect = (stage: Stage) => {
		setSelectedStage({
			id: stage.path, // use path as id
			name: stage.name,
			url: `${serverUrl}${stage.path}`, // construct full WebSocket URL
		});
	};

	const handleCreateStage = async () => {
		if (!newStageName.trim()) return;

		setIsCreating(true);
		try {
			const response = await fetch(`${serverUrl}/api/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name: newStageName }),
			});

			if (response.ok) {
				setCreateModalVisible(false);
				setNewStageName("");
				fetchStages(); // Refresh the list
			}
		} catch (error) {
			console.error("Failed to create stage:", error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleCloseStage = () => {
		setSelectedStage(null);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<Button
				title="Create New Stage"
				onPress={() => setCreateModalVisible(true)}
			/>

			<FlatList
				data={stages}
				keyExtractor={(item) => item.path}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.stageItem}
						onPress={() => handleStageSelect(item)}
					>
						<Text style={styles.stageName}>{item.name}</Text>
						<Text style={styles.stageInfo}>
							{`${item.clients.length} clients • Created ${new Date(item.created_at).toLocaleDateString()}`}
						</Text>
					</TouchableOpacity>
				)}
			/>

			{/* Create Stage Modal */}
			<Modal
				visible={isCreateModalVisible}
				animationType="fade"
				transparent={true}
				onRequestClose={() => setCreateModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<SafeAreaView style={styles.modalContainer}>
						<View style={styles.modalContent}>
							<Text style={styles.modalTitle}>Create New Stage</Text>
							<TextInput
								style={styles.input}
								value={newStageName}
								onChangeText={setNewStageName}
								placeholder="Stage Name"
								autoFocus
							/>
							<View style={styles.modalButtons}>
								<TouchableOpacity
									style={styles.button}
									onPress={() => setCreateModalVisible(false)}
								>
									<Text style={styles.buttonText}>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.button,
										isCreating || !newStageName.trim()
											? styles.buttonDisabled
											: styles.buttonPrimary,
									]}
									onPress={handleCreateStage}
									disabled={isCreating || !newStageName.trim()}
								>
									<Text style={styles.buttonText}>
										{isCreating ? "Creating..." : "Create"}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</SafeAreaView>
				</View>
			</Modal>

			{/* Recording Modal */}
			<Modal
				visible={selectedStage !== null}
				animationType="slide"
				transparent={true}
				onRequestClose={handleCloseStage}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						{selectedStage && (
							<>
								<Text style={styles.modalTitle}>{selectedStage.name}</Text>
								<RecordingControls
									serverUrl={selectedStage.url}
									onClose={handleCloseStage}
								/>
							</>
						)}
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	stageItem: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	modalContainer: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	modalContent: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 20,
		elevation: 5, // Android shadow
		shadowColor: "#000", // iOS shadow
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
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
		marginTop: 20,
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
});

export default StageList;
