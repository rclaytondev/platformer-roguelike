import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Spider } from "../entities/Spider.mjs";
import { World } from "../world/World.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { TestScenario } from "../TestScenario.mjs";

export const enemyDestructionScenario = new TestScenario(() => {
	const world = new World(false);

	world.tiles.set(-1, -5, TowerTile.TOWER_TILE);
	Spider.spawn(new Vector(-1, -6), world);

	world.tiles.set(0, 0, TowerTile.TOWER_TILE);
	world.tiles.set(0, 3, TowerTile.TOWER_TILE);
	Spider.spawn(new Vector(0, 1), world);

	return [world];
});

