import React from "react";
import { ReflowReactComponent } from "@web-desktop-environment/reflow-react-display-layer";
import DesktopInterface, {
	App,
	OpenApp,
} from "@web-desktop-environment/interfaces/lib/views/Desktop";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Home from "@layoutComponents/Home";
import AppView from "@layoutComponents/AppView";
import { StyleSheet, Text } from "react-native";
import { Theme } from "@root/theme";
import { ThemeContext } from "@components/themeProvider";
import Icon from "@components/icon";

interface DesktopContextInterface {
	openApps: OpenApp[];
	apps: App[];
	currentApp?: OpenApp;
	background?: string;
	setCurrentApp: (currentApp: OpenApp) => void;
	closeApp: (id: number) => void;
	launchApp: (newApp: App) => void;
}

export const DesktopContext = React.createContext<DesktopContextInterface>({
	apps: [],
	openApps: [],
	setCurrentApp: () => {
		/* */
	},
	closeApp: () => {
		/* */
	},
	launchApp: () => {
		/* */
	},
});

interface DesktopState {
	currentApp?: OpenApp;
}

class Desktop extends ReflowReactComponent<DesktopInterface, {}, DesktopState> {
	state: DesktopState = {};

	navigator = createBottomTabNavigator();

	makeStyles = (theme: Theme) =>
		StyleSheet.create({
			tabBar: {
				backgroundColor:
					theme.type === "transparent"
						? theme.secondary.main
						: theme.background.main,
				borderTopColor: theme.windowBorderColor,
				borderTopWidth: 1,
				elevation: theme.type === "transparent" ? 0 : 4,
			},
		});

	render() {
		const { currentApp } = this.state;
		const { apps, openApps, nativeBackground: background, event } = this.props;
		return (
			<ThemeContext.Consumer>
				{(theme) => {
					const styles = this.makeStyles(theme);
					return (
						<DesktopContext.Provider
							value={{
								openApps: openApps,
								apps: apps,
								currentApp: currentApp,
								background,
								setCurrentApp: (newCurrentApp) =>
									this.setState({ currentApp: newCurrentApp }),
								launchApp: (app) =>
									event("launchApp", { flow: app.flow, params: {} }),
								closeApp: (id) => {
									event("closeApp", id);
									if (id === currentApp?.id) {
										this.setState({ currentApp: undefined });
									}
								},
							}}
						>
							<NavigationContainer>
								<this.navigator.Navigator
									screenOptions={({ route }) => ({
										tabBarLabel: ({ focused }) => (
											<Text
												style={{
													color: focused
														? theme.primary.light
														: theme.background.text,
												}}
											>
												{route.name === "Home" ? "Launcher" : currentApp?.name}
											</Text>
										),
										tabBarIcon: ({ color, size, focused }) =>
											route.name === "Home" || !currentApp ? (
												<Icon
													icon={{
														icon: "home",
														type: "MaterialCommunityIcons",
													}}
													size={size}
													color={
														focused
															? theme.primary.light
															: theme.background.text
													}
												/>
											) : (
												<Icon
													icon={currentApp.nativeIcon}
													size={size}
													color={color}
												/>
											),
									})}
									tabBarOptions={{ style: styles.tabBar }}
								>
									<this.navigator.Screen name="Home" component={Home} />
									{currentApp && (
										<this.navigator.Screen
											name="Running-App"
											component={AppView}
										/>
									)}
								</this.navigator.Navigator>
							</NavigationContainer>
						</DesktopContext.Provider>
					);
				}}
			</ThemeContext.Consumer>
		);
	}
}

export default Desktop;
