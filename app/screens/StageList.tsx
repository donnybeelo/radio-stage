import React, {
	useEffect,
	useState,
	useLayoutEffect,
	useCallback,
} from "react"; // Added useCallback
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
import { useNavigation } from "@react-navigation/native"; // Import navigation hook
import RecordingControls from "../components/RecordingControls";
import styles from "../styles/StageList.styles";
import Ionicons from "@expo/vector-icons/Ionicons";
import PillButton from "../components/PillButton";

interface Stage {
	path: string;
	name: string;
	created_at: string;
	clients: string[];
}

interface StageListProps {
	serverUrl: string;
	leave: () => void;
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

const StageList: React.FC<StageListProps> = ({ serverUrl, leave }) => {
	const navigation = useNavigation(); // Initialize navigation
	const [stages, setStages] = useState<Stage[]>([]);
	const [selectedStage, setSelectedStage] = useState<StageListItem | null>(
		null
	);
	const [isCreateModalVisible, setCreateModalVisible] = useState(false);
	const [newStageName, setNewStageName] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		fetchStages();
		const intervalId = setInterval(fetchStages, 2000); // Refresh every 2 seconds
		return () => clearInterval(intervalId); // Cleanup interval on unmount
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
			id: stage.path,
			name: stage.name,
			url: `${serverUrl}${stage.path}`,
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
				fetchStages();
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

	const handleLeaveServer = useCallback(() => {
		navigation.setOptions({
			headerRight: null,
		}); // Remove header button
		leave(); // Use the passed function to update the state
	}, [navigation, leave]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<PillButton
					icon="exit-outline"
					style={styles.leaveFab}
					onPress={handleLeaveServer}
				/>
			),
		});
	}, [navigation, handleLeaveServer]); // Added handleLeaveServer to dependencies

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
							{`${item.clients.length} connected • Created ${new Date(item.created_at).toLocaleDateString()}`}
						</Text>
					</TouchableOpacity>
				)}
			/>

			<PillButton
				icon="add"
				style={styles.fab}
				onPress={() => setCreateModalVisible(true)}
			/>

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
								<PillButton
									onPress={() => setCreateModalVisible(false)}
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
					</SafeAreaView>
				</View>
			</Modal>

			<Modal
				visible={selectedStage !== null}
				animationType="slide"
				transparent={true}
				onRequestClose={handleCloseStage}
			>
				<Pressable onPress={handleCloseStage} style={styles.modalOverlay}>
					<View
						style={styles.modalOverlay}
						onStartShouldSetResponder={() => true}
						onTouchEnd={(e) => e.stopPropagation()}
					>
						<SafeAreaView style={styles.modalContainer}>
							<View style={styles.modalContent}>
								{selectedStage && (
									<RecordingControls
										name={selectedStage.name}
										serverUrl={selectedStage.url}
										onClose={handleCloseStage}
									/>
								)}
							</View>
						</SafeAreaView>
					</View>
				</Pressable>
			</Modal>
		</SafeAreaView>
	);
};

export default StageList;
