import React, { useState, useEffect } from "react";
import {
	View,
	TextInput,
	StyleSheet,
	Text,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PillButton from "../components/PillButton";

export type ProfileType = "audience" | "actor" | "director";

interface ConnectScreenProps {
	onConnect: (url: string, profileType: ProfileType) => void;
	serverUrl?: string;
}

export default function ConnectScreen({
	onConnect,
	serverUrl: initialServerUrl,
}: ConnectScreenProps) {
	const [serverUrl, setServerUrl] = useState(initialServerUrl || "");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [recentServers, setRecentServers] = useState<string[]>([]);
	const [selectedProfile, setSelectedProfile] =
		useState<ProfileType>("audience");

	// Update URL when prop changes
	useEffect(() => {
		setServerUrl(initialServerUrl || "");
	}, [initialServerUrl]);

	// Load recent server connections
	useEffect(() => {
		const loadRecentServers = async () => {
			const storedServers = await AsyncStorage.getItem("recentServers");
			if (storedServers) {
				setRecentServers(JSON.parse(storedServers));
			}
		};
		loadRecentServers();
	}, []);

	// Attempt to connect to server
	const handleConnect = async (server: string = "") => {
		setIsLoading(true);
		setError(null);

		try {
			let url = server.trim();
			if (!url) {
				url = serverUrl.trim();
			} else {
				setServerUrl(url);
			}

			// Add http:// if missing
			if (!url.startsWith("http")) {
				url = `http://${url}`;
			}

			// Test server connection
			const response = await fetch(`${url}:8080/api/`);
			const data = await response.json();

			if (data.status === "success") {
				// Save to recent servers
				const updatedServers = [
					url,
					...recentServers.filter((s) => s !== url),
				].slice(0, 5); // Keep max 5
				setRecentServers(updatedServers);
				await AsyncStorage.setItem(
					"recentServers",
					JSON.stringify(updatedServers)
				);

				// Save URL and connect
				await AsyncStorage.setItem("serverUrl", url);
				setIsLoading(false);
				onConnect(url, selectedProfile);
			} else {
				setError("Invalid server response");
				setIsLoading(false);
			}
		} catch (error) {
			setError("Failed to connect to server");
			setIsLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Connect to Server</Text>
			<TextInput
				style={styles.input}
				value={serverUrl}
				onChangeText={setServerUrl}
				placeholder="Enter server URL (e.g., http://example.com)"
				autoCapitalize="none"
				autoCorrect={false}
				editable={!isLoading}
			/>

			{/* Profile selection */}
			<View style={styles.profileContainer}>
				<Text style={styles.profileTitle}>Select Your Profile:</Text>
				<View style={styles.profileOptions}>
					{(["audience", "actor", "director"] as ProfileType[]).map(
						(profile) => (
							<TouchableOpacity
								key={profile}
								style={[
									styles.profileButton,
									selectedProfile === profile && styles.profileButtonSelected,
								]}
								onPress={() => setSelectedProfile(profile)}
								disabled={isLoading}
							>
								<Text
									style={[
										styles.profileButtonText,
										selectedProfile === profile &&
											styles.profileButtonTextSelected,
									]}
								>
									{profile.charAt(0).toUpperCase() + profile.slice(1)}
								</Text>
							</TouchableOpacity>
						)
					)}
				</View>
			</View>

			{error && <Text style={styles.error}>{error}</Text>}
			{isLoading ? (
				<ActivityIndicator size="large" color="#0000ff" />
			) : (
				<PillButton title="Connect" onPress={() => handleConnect()} />
			)}
			{recentServers.length > 0 && (
				<View style={styles.recentServersContainer}>
					<Text style={styles.recentServersTitle}>
						Recently Connected Servers
					</Text>
					{recentServers.map((server, index) => (
						<TouchableOpacity
							key={index}
							style={styles.recentServersItem}
							onPress={() => handleConnect(server)}
						>
							<Text style={styles.recentServersTitle}>{server}</Text>
						</TouchableOpacity>
					))}
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		padding: 20,
		width: 300,
		marginHorizontal: "auto",
	},
	title: {
		fontSize: 24,
		marginBottom: 20,
		textAlign: "center",
	},
	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
		padding: 10,
		marginBottom: 20,
	},
	error: {
		color: "red",
		marginBottom: 10,
		textAlign: "center",
	},
	recentServersContainer: {
		marginTop: 20,
		borderColor: "rgba(0, 0, 0, 0.5)",
		borderWidth: 1,
		borderRadius: 5,
		backgroundColor: "rgba(0, 0, 0, 0.1)",
	},
	recentServersItem: {
		padding: 5,
		borderTopWidth: 1,
		borderTopColor: "rgba(0, 0, 0, 0.5)",
		backgroundColor: "rgba(0, 0, 0, 0.1)",
	},
	recentServersTitle: {
		fontSize: 15,
		marginVertical: 5,
		textAlign: "center",
	},
	profileContainer: {
		marginBottom: 20,
	},
	profileTitle: {
		fontSize: 16,
		marginBottom: 10,
		textAlign: "center",
		color: "#555",
	},
	profileOptions: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	profileButton: {
		paddingVertical: 8,
		paddingHorizontal: 15,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#ccc",
		backgroundColor: "#f0f0f0",
	},
	profileButtonSelected: {
		backgroundColor: "#007bff",
		borderColor: "#0056b3",
	},
	profileButtonText: {
		color: "#333",
		fontSize: 14,
	},
	profileButtonTextSelected: {
		color: "#fff",
	},
});
