import "./Initializer.mjs";
import { canvasIO } from "./CanvasIOInitializer.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { LevelGenerator } from "../level-generator/LevelGenerator.mjs";
import { Main } from "../Main.mjs";
import { WorldScreen } from "../world/WorldScreen.mjs";
import { basicCollisionScenario } from "../debug-scenarios/basic-collision-test.mjs";

const [world] = basicCollisionScenario.setupWorld();
Main.screen = new WorldScreen(world, canvasIO);


if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ENABLED && Main.screen instanceof WorldScreen) {
	// eslint-disable-next-line no-console
	console.time("generating chunk");
	const generator = new LevelGenerator(new Vector(0, 0));
	generator.generateLevel(Main.screen.world);
	generator.visualize(canvasIO!, false);
	// eslint-disable-next-line no-console
	console.timeEnd("generating chunk");
	// eslint-disable-next-line no-debugger
	debugger;
}

if(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ROOM_FREQUENCY_TRIALS !== 0) {
	// eslint-disable-next-line no-console
	console.log(LevelGenerator.roomFrequencies(DEBUG_SETTINGS.GENERATOR_VISUALIZATION.ROOM_FREQUENCY_TRIALS));
	// eslint-disable-next-line no-debugger
	debugger;
}
