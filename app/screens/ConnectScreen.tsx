import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Text, Alert } from "react-native";
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

	useEffect(() => {
		setServerUrl(initialServerUrl || "");
	}, [initialServerUrl]);

	const handleConnect = async () => {
		try {
			var wsUrl = serverUrl.replace(/^http/, "ws");
			if (!wsUrl.startsWith("ws")) {
				wsUrl = `ws://${wsUrl}`;
			}
			const ws = new WebSocket(`${wsUrl}:8080/ws`);

			// Set a timeout for the connection attempt
			const timeoutId = setTimeout(() => {
				ws.close();
				Alert.alert("Error", "Connection timeout");
			}, 5000);

			ws.onopen = async () => {
				clearTimeout(timeoutId);
				ws.close();
				await AsyncStorage.setItem("serverUrl", serverUrl);
				onConnect();
			};

			ws.onerror = () => {
				clearTimeout(timeoutId);
				Alert.alert("Error", "Failed to connect to server");
			};
		} catch (error) {
			Alert.alert("Error", "Invalid server URL");
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
			/>
			<Button title="Connect" onPress={handleConnect} />
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
});
