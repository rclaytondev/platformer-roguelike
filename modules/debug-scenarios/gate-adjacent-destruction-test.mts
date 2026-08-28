import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Gate } from "../entities/Gate.mjs";
import { TeleportingCreature } from "../entities/TeleportingCreature.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const gateAdjacentDestructionScenario = new TestScenario(() => {
	const world = new World(false);
	world.tiles.set(5, -3, TowerTile.TOWER_TILE);
	world.tiles.set(7, -3, TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(0, 0, 10, 1), TowerTile.TOWER_TILE);
	const gate = Gate.atTile(new Vector(6, -3), "right", false, world);
	world.addEntityIfEmpty(gate);

	const creature = TeleportingCreature.atTile(new Vector(5, -2));
	world.addEntityIfEmpty(creature);

	return [world];
});

