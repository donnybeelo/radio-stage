import React, { useEffect, useState } from "react";
import {
	View,
	FlatList,
	TouchableOpacity,
	Text,
	Modal,
	TextInput,
	Button,
	Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RecordingControls from "../components/RecordingControls";
import styles from "../styles/StageList.styles";

interface Stage {
	path: string;
	name: string;
	created_at: string;
	clients: string[];
}

interface StageListProps {
	serverUrl: string;
}

interface StageListItem {
	id: string;
	name: string;
	url: string;
}

interface StageResponse {
	status: string;
	message: string;
	data: Stage[];
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
			<FlatList
				data={stages.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))}
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

			{/* Floating Action Button */}
			<TouchableOpacity
				style={styles.fab}
				onPress={() => setCreateModalVisible(true)}
			>
				<Text style={styles.fabText}>+</Text>
			</TouchableOpacity>

			{/* Create Stage Modal */}
			<Modal
				visible={isCreateModalVisible}
				animationType="slide"
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
								<Button
									onPress={() => setCreateModalVisible(false)}
									title="Cancel"
									color="#F00"
								/>
								<Button
									title={isCreating ? "Creating..." : "Create"}
									onPress={handleCreateStage}
									disabled={isCreating || !newStageName.trim()}
									color="#007AFF"
								/>
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
				<Pressable onPress={handleCloseStage} style={styles.modalOverlay}>
					<View
						style={styles.modalContainer}
						onStartShouldSetResponder={() => true}
						onTouchEnd={(e) => e.stopPropagation()}
					>
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
				</Pressable>
			</Modal>
		</SafeAreaView>
	);
};

export default StageList;
