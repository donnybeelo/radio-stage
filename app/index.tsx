import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ConnectScreen, { ProfileType } from "./screens/ConnectScreen"; // Import ProfileType
import StageList from "./screens/StageList";

const App = () => {
	const [isConnected, setIsConnected] = useState(false);
	const [storedUrl, setStoredUrl] = useState<string | null>(null);
	const [profileType, setProfileType] = useState<ProfileType>("audience"); // Add state for profile type

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
				// Update onConnect to receive profileType
				onConnect={(url, selectedProfile) => {
					setIsConnected(true);
					setStoredUrl(url);
					setProfileType(selectedProfile); // Store the selected profile
				}}
				serverUrl={storedUrl || ""}
			/>
		);
	} else {
		return (
			<StageList
				serverUrl={storedUrl! + ":8080"}
				leave={() => setIsConnected(false)}
				profileType={profileType} // Pass profileType to StageList
			/>
		);
	}
};

export default App;
