import { Flow } from "@web-desktop-environment/reflow";
import { ViewInterfacesType } from "@web-desktop-environment/interfaces";
import { App } from "@apps/index";
import Logger from "@utils/logger";
import { defaultFlowInput } from "@managers/desktopManager";

export interface WindowInput<
	P extends Record<string, unknown> = Record<string, unknown>,
	T extends App<P> = App<P>
> {
	app: T;
	appParams: P;
	parentLogger: Logger;
}

const window: Flow<
	ViewInterfacesType,
	WindowInput & defaultFlowInput
> = async ({
	view,
	views,
	flow,
	viewerParameters,
	input: { app, appParams, parentLogger, desktopManager },
}) => {
	const logger = parentLogger.mount("window");

	const listenToNewTheme = desktopManager.settingsManager.emitter.on(
		"onNewSettings",
		(settings) => {
			viewerParameters({
				theme: settings.desktop.theme,
				customTheme: settings.desktop.customTheme,
			});
		}
	);

	const appWindow = { ...app.window };
	const window = view(0, views.window, {
		icon: app.icon,
		title: app.name,
		name: app.name,
		window: appWindow,
		background: desktopManager.settingsManager.settings.desktop.background,
	});

	const listenToNewBackground = desktopManager.settingsManager.emitter.on(
		"onNewSettings",
		(settings) => {
			window.update({ background: settings.desktop.background });
		}
	);

	window.on("setWindowState", ({ minimized, position, size }) => {
		appWindow.position = position;
		appWindow.minimized = minimized;
		appWindow.height = size.height;
		appWindow.width = size.width;
		window.update({ window: appWindow });
	});

	window.on("launchApp", async (app) => {
		logger.info(`launch app flow ${app.flow}`);
		desktopManager.windowManager.spawnApp(app.flow, app.params);
	});

	const runningApp = flow(
		app.flow,
		{
			...app.defaultInput,
			...appParams,
			parentLogger: logger,
			desktopManager,
		},
		window
	);

	runningApp.on("change_title", (title) => {
		logger.info(`update window title to ${title}`);
		window.update({ title });
	});

	const cleanUp = () => {
		listenToNewBackground.remove();
		listenToNewTheme.remove();
	};

	window.then(() => {
		logger.warn(`window ${app.name} - flow is canceled`);
		runningApp.cancel();
		cleanUp();
	});
	await runningApp;
	window.done({});
	await window;
};

export default window;
