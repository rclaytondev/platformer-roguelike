import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { TeleportingCreature } from "../entities/TeleportingCreature.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const teleportingCreatureScenario = new TestScenario(() => {
	const world = new World(false);

	world.addEntityIfEmpty(TeleportingCreature.atTile(new Vector(4, -1), world));
	world.addEntityIfEmpty(TeleportingCreature.atTile(new Vector(5, -1), world));
	world.addEntityIfEmpty(TeleportingCreature.atTile(new Vector(6, -1), world));
	world.addEntityIfEmpty(TeleportingCreature.atTile(new Vector(7, -1), world));



	world.tiles.fillRect(Rectangle.fromDimensions(0, 0, 10, 10), TowerTile.TOWER_TILE);
	// world.tiles.fillRect(Rectangle.fromDimensions(5, 0, 10, 1), EmptyTile.EMPTY);
	world.tiles.fillRect(Rectangle.fromDimensions(-1, -5, 1, 10), TowerTile.TOWER_TILE);

	return [world];
});

