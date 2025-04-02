import React, { useState, useEffect } from "react";
import {
	View,
	TextInput,
	Button,
	StyleSheet,
	Text,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ConnectScreenProps {
	onConnect: (url: string) => void;
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

	useEffect(() => {
		setServerUrl(initialServerUrl || "");
	}, [initialServerUrl]);

	useEffect(() => {
		const loadRecentServers = async () => {
			const storedServers = await AsyncStorage.getItem("recentServers");
			if (storedServers) {
				setRecentServers(JSON.parse(storedServers));
			}
		};
		loadRecentServers();
	}, []);

	const handleConnect = async (server: string = "") => {
		setIsLoading(true);
		setError(null);

		try {
			let url = server.trim();
			if (!url) {
				url = serverUrl.trim(); // Use the current serverUrl state
			} else {
				setServerUrl(url);
			}
			if (!url.startsWith("http")) {
				url = `http://${url}`;
			}

			const response = await fetch(`${url}:8080/api/`);
			const data = await response.json();

			if (data.status === "success") {
				// Save server URL to recent servers
				const updatedServers = [
					url,
					...recentServers.filter((s) => s !== url),
				].slice(0, 5); // Keep max 5 servers
				setRecentServers(updatedServers);
				await AsyncStorage.setItem(
					"recentServers",
					JSON.stringify(updatedServers)
				);

				await AsyncStorage.setItem("serverUrl", url);
				setIsLoading(false);
				onConnect(url);
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
			{error && <Text style={styles.error}>{error}</Text>}
			{isLoading ? (
				<ActivityIndicator size="large" color="#0000ff" />
			) : (
				<Button title="Connect" onPress={() => handleConnect()} />
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
});
