import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PillButtonProps {
	onPress: () => void;
	icon?: React.ComponentProps<typeof Ionicons>["name"];
	text?: string;
	darkText?: boolean;
	style?: object;
	disabled?: boolean;
	title?: string;
	customText?: React.ReactNode;
}

const PillButton: React.FC<PillButtonProps> = ({
	icon,
	text,
	onPress,
	darkText,
	style,
	disabled,
	title,
	customText,
}) => {
	text = text || title; // Use title if text is not provided
	let textColour = "#fff";
	if (disabled) {
		textColour = "#A9A9A9"; // Light gray for disabled text
	} else if (darkText) {
		textColour = "#000";
	}

	if (customText) {
		return (
			<TouchableOpacity
				style={[styles.iconCustomButton, style, disabled && styles.disabled]}
				onPress={onPress}
				disabled={disabled}
			>
				{customText}
			</TouchableOpacity>
		);
	}
	if (!icon && !text) {
		throw new Error(
			'PillButton requires at least one of "icon" or "text" to be provided.'
		);
	} else if (!text) {
		return (
			<TouchableOpacity
				style={[styles.iconButton, style, disabled && styles.disabled]}
				onPress={onPress}
				disabled={disabled}
			>
				<Ionicons name={icon} size={24} color={textColour} />
			</TouchableOpacity>
		);
	} else if (!icon) {
		return (
			<TouchableOpacity
				style={[styles.textButton, style, disabled && styles.disabled]}
				onPress={onPress}
				disabled={disabled}
			>
				<Text style={[styles.noIconText, { color: textColour }]}>{text}</Text>
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity
			style={[styles.iconTextButton, style, disabled && styles.disabled]}
			onPress={onPress}
			disabled={disabled}
		>
			<Ionicons name={icon} size={24} color={textColour} />
			<Text style={[styles.iconText, { color: textColour }]}>{text}</Text>
		</TouchableOpacity>
	);
};

const styleBase = StyleSheet.create({
	buttonBase: {
		borderRadius: 28,
		width: "auto",
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: 8,
		backgroundColor: "#007AFF",
		height: 56,
		paddingHorizontal: 14,
		justifyContent: "center",
		boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.3)", // Replaced shadow properties with boxShadow
	},
	textBase: {
		color: "#fff",
		fontSize: 16,
		textTransform: "uppercase",
	},
});

const styles = StyleSheet.create({
	iconTextButton: styleBase.buttonBase,
	iconCustomButton: {
		...StyleSheet.flatten([
			styleBase.buttonBase,
			{
				height: "auto",
				width: "auto",
				padding: 5,
			},
		]),
	},
	iconButton: {
		...StyleSheet.flatten([
			styleBase.buttonBase,
			{
				width: 56,
			},
		]),
	},
	textButton: {
		...StyleSheet.flatten([
			styleBase.buttonBase,
			{
				height: 40,
			},
		]),
	},
	disabled: {
		backgroundColor: "#cccccc",
		opacity: 0.7,
		elevation: 0,
		boxShadow: "none",
	},
	iconText: {
		...StyleSheet.flatten([
			styleBase.textBase,
			{
				marginLeft: 10,
			},
		]),
	},
	noIconText: styleBase.textBase,
});

export default PillButton;
