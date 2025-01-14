import { Text, View } from "react-native";

export default function Index() {
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
			}}
		>
			<View
				style={{
					backgroundColor: "lightblue",
					padding: 10,
					margin: 10,
					width: "80%",
					height: 250,
					borderRadius: 10,
				}}
			>
				<View
					style={{
						backgroundColor: "white",
						padding: 2,
						margin: 2,
						width: "auto",
						height: "auto",
						marginBottom: 50,
						alignItems: "center",
						flex: 1,
						borderRadius: 10,
					}}
				></View>
			</View>
		</View>
	);
}
