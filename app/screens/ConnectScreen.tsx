import React, { useState, useEffect } from "react";
import {
	View,
	TextInput,
	Button,
	StyleSheet,
	Text,
	ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ConnectScreenProps {
	onConnect: () => void;
	serverUrl?: string;
}

export default function ConnectScreen({
	onConnect,
	serverUrl: initialServerUrl,
}: ConnectScreenProps) {
	const [serverUrl, setServerUrl] = useState(initialServerUrl || "");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setServerUrl(initialServerUrl || "");
	}, [initialServerUrl]);

	const handleConnect = async () => {
		setIsLoading(true);
		setError(null);

		try {
			var wsUrl = serverUrl.replace(/^http/, "ws");
			if (!wsUrl.startsWith("ws")) {
				wsUrl = `ws://${wsUrl}`;
			}
			const ws = new WebSocket(`${wsUrl}:8080/ws`);

			const timeoutId = setTimeout(() => {
				ws.close();
				setError("Connection timeout");
				setIsLoading(false);
			}, 5000);

			ws.onopen = async () => {
				clearTimeout(timeoutId);
				ws.close();
				await AsyncStorage.setItem("serverUrl", serverUrl);
				setIsLoading(false);
				onConnect();
			};

			ws.onerror = () => {
				clearTimeout(timeoutId);
				setError("Failed to connect to server");
				setIsLoading(false);
			};
		} catch (error) {
			setError("Invalid server URL");
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
				<Button title="Connect" onPress={handleConnect} />
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		padding: 20,
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
});
