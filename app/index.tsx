import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConnectScreen from "./screens/ConnectScreen";
import StageList from "./screens/StageList";

const App = () => {
	const [isConnected, setIsConnected] = useState(false);
	const [storedUrl, setStoredUrl] = useState<string | null>(null);

	useEffect(() => {
		loadStoredUrl();
	}, []);

	const loadStoredUrl = async () => {
		const serverUrl = await AsyncStorage.getItem("serverUrl");
		setStoredUrl(serverUrl);
	};

	if (!isConnected) {
		return (
			<ConnectScreen
				onConnect={(url) => {
					setIsConnected(true);
					setStoredUrl(url);
				}}
				serverUrl={storedUrl || ""}
			/>
		);
	} else {
		return (
			<StageList
				serverUrl={storedUrl! + ":8080"}
				leave={() => setIsConnected(false)}
			/>
		);
	}
};

export default App;
