import React, {
	useEffect,
	useState,
	useLayoutEffect,
	useCallback,
	useRef,
} from "react";
import {
	View,
	FlatList,
	TouchableOpacity,
	Text,
	Modal,
	TextInput,
	Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import RecordingControls from "../components/RecordingControls";
import styles from "../styles/StageList.styles";
import PillButton from "../components/PillButton";
import { ProfileType } from "./ConnectScreen";

interface Stage {
	path: string;
	name: string;
	created_at: string;
	clients: string[];
}

interface StageListProps {
	serverUrl: string;
	leave: () => void;
	profileType: ProfileType;
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

const StageList: React.FC<StageListProps> = ({
	serverUrl,
	leave,
	profileType,
}) => {
	const navigation = useNavigation();
	const [stages, setStages] = useState<Stage[]>([]);
	const [selectedStage, setSelectedStage] = useState<StageListItem | null>(
		null
	);
	const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);
	const [isCreateModalVisible, setCreateModalVisible] = useState(false);
	const [newStageName, setNewStageName] = useState("");
	const [createStageErrorMessage, setCreateStageErrorMessage] = useState<
		string | null
	>(null);
	const [isCreating, setIsCreating] = useState(false);

	// Fetch stages periodically
	useEffect(() => {
		fetchStages();
		const intervalId = setInterval(fetchStages, 2000);
		return () => clearInterval(intervalId);
	}, []);

	// Get available stages from server
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

	// Handle stage selection
	const handleStageSelect = (stage: Stage) => {
		fadeIn();
		setSelectedStage({
			id: stage.path,
			name: stage.name,
			url: `${serverUrl}${stage.path}`,
		});
	};

	// Create a new stage
	const handleCreateStage = async () => {
		setCreateStageErrorMessage(null);
		if (!newStageName.trim()) return;
		if (stages.some((stage) => stage.name === newStageName)) {
			setCreateStageErrorMessage("Stage name already exists.");
			return;
		}

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
				fadeOut();
				setCreateModalVisible(false);
				setNewStageName("");
				fetchStages();
			}
		} catch (error) {
			console.error("Failed to create stage:", error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleDeleteStage = async (path: string) => {
		try {
			await fetch(`${serverUrl}/api/`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path }),
			});
			fetchStages();
		} catch (err) {
			console.error("Failed to delete stage:", err);
		}
		handleCloseModal();
	};

	const handleCloseModal = () => {
		setSelectedStage(null);
		setCreateStageErrorMessage(null);
		setNewStageName("");
		setCreateModalVisible(false);
		setStageToDelete(null);
		fadeOut();
	};

	const confirmDeleteStage = (stage: Stage) => {
		setStageToDelete(stage);
		fadeIn();
	};

	// Handle leaving the server
	const handleLeaveServer = () => {
		navigation.setOptions({
			headerRight: null,
			headerTitle: "RadioStage",
		});
		leave();
	};
	const handleOpenCreateModal = (): void => {
		setCreateModalVisible(true);
		fadeIn();
	};

	const fadeAnim = useRef(new Animated.Value(0)).current;

	const fadeIn = () => {
		// Will change fadeAnim value to 1 in 5 seconds
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 250,
			useNativeDriver: true,
		}).start();
	};

	const fadeOut = () => {
		// Will change fadeAnim value to 0 in 3 seconds
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 150,
			useNativeDriver: true,
		}).start();
	};

	// Setup header with profile info
	useLayoutEffect(() => {
		let headerTitle = "RadioStage";
		if (profileType === "actor" || profileType === "director") {
			headerTitle += ` - ${profileType.charAt(0).toUpperCase() + profileType.slice(1)}`;
		}

		navigation.setOptions({
			headerTitle: headerTitle,
			headerRight: () => (
				<PillButton
					icon="exit-outline"
					style={[styles.destructiveButton, { boxShadow: null }]}
					onPress={handleLeaveServer}
				/>
			),
		});
	}, [navigation, handleLeaveServer, profileType]);

	return (
		<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
			{/* List of stages */}
			{stages.length === 0 && (
				<Text style={{ padding: 10 }}>
					No stages available.
					{profileType === "director" && " Create a new stage to get started!"}
				</Text>
			)}
			<FlatList
				data={stages.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))}
				keyExtractor={(item) => item.path}
				renderItem={({ item }) => (
					<View
						style={[
							styles.stageItem,
							{
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
							},
						]}
					>
						<TouchableOpacity
							onPress={() => handleStageSelect(item)}
							style={{ flex: 1 }}
						>
							<Text style={styles.stageName}>{item.name}</Text>
							<Text
								style={styles.stageInfo}
							>{`${item.clients.length} connected • Created ${new Date(item.created_at).toLocaleDateString()}`}</Text>
						</TouchableOpacity>
						{profileType === "director" && (
							<PillButton
								onPress={() => confirmDeleteStage(item)}
								icon="trash-outline"
								style={styles.destructiveButton}
							></PillButton>
						)}
					</View>
				)}
			/>

			{/* Create Stage button (director only) */}
			{profileType === "director" && (
				<PillButton
					icon="add"
					style={styles.createStage}
					onPress={handleOpenCreateModal}
				/>
			)}

			{/* Overlay for modals */}
			<Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />

			{/* Create Stage Modal */}
			<Modal
				visible={isCreateModalVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={handleCloseModal}
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Create New Stage</Text>
						<TextInput
							style={styles.input}
							value={newStageName}
							onChangeText={setNewStageName}
							placeholder="Stage Name"
							autoFocus
							onSubmitEditing={handleCreateStage}
						/>
						{createStageErrorMessage && (
							<Text
								style={{
									color: "red",
									textAlign: "center",
								}}
							>
								{createStageErrorMessage}
							</Text>
						)}

						{/* Buttons */}
						<View style={styles.modalButtons}>
							<PillButton
								onPress={handleCloseModal}
								text="Cancel"
								style={{ backgroundColor: "#F00" }}
							/>
							<PillButton
								text={isCreating ? "Creating..." : "Create"}
								onPress={handleCreateStage}
								disabled={isCreating || !newStageName.trim()}
								style={{ backgroundColor: "#007AFF" }}
							/>
						</View>
					</View>
				</View>
			</Modal>

			{/* Stage Controls Modal */}
			<Modal
				visible={selectedStage !== null}
				animationType="slide"
				transparent={true}
				style={styles.modalContainer}
			>
				<View style={styles.modalContainer}>
					<View
						style={styles.modalContent}
						onStartShouldSetResponder={() => true}
						onTouchEnd={(e) => e.stopPropagation()}
					>
						{selectedStage && (
							<RecordingControls
								name={selectedStage.name}
								serverUrl={selectedStage.url}
								onClose={handleCloseModal}
								profileType={profileType}
							/>
						)}
					</View>
				</View>
			</Modal>
			{/* Confirm Delete Stage Modal */}
			<Modal
				visible={stageToDelete !== null}
				animationType="fade"
				transparent={true}
				onRequestClose={handleCloseModal}
			>
				<View style={styles.modalContainerCentred}>
					<View style={styles.modalContentCentred}>
						<Text style={styles.modalTitle}>Confirm Deletion</Text>
						<Text style={{ textAlign: "center" }}>
							Are you sure you want to delete the stage '{stageToDelete?.name}'?
						</Text>
						<View style={[styles.modalButtons, { marginTop: 20 }]}>
							<PillButton onPress={handleCloseModal} text="Cancel" />
							<PillButton
								text="Delete"
								onPress={() => handleDeleteStage(stageToDelete!.path)}
								style={styles.destructiveButton}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
};

export default StageList;
