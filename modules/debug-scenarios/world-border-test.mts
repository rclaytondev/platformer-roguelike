import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldBorder } from "../entities/WorldBorder.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { World } from "../world/World.mjs";

export const worldBorderScenario = new TestScenario(() => {
	const world = new World(false);
	world.entities.add(new WorldBorder(Rectangle.fromBounds(-Infinity, Infinity, 0, 100), world));

	return [world];
});

