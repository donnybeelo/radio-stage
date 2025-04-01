import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
	return (
		<Stack
			screenOptions={{
				headerTitle: "RadioStage",
				navigationBarColor: "transparent",
				statusBarStyle: "dark",
			}}
		>
			<Stack.Screen name="index" />
		</Stack>
	);
}
