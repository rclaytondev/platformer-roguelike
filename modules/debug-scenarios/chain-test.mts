import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Chain } from "../entities/Chain.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const chainScenario = new TestScenario(() => {
	const world = new World(false);
	world.tiles.set(0, 0, TowerTile.TOWER_TILE);

	world.tiles.set(3, -2, TowerTile.TOWER_TILE);
	world.entities.add(new Chain(new Vector(3, -1), 1, world));
	world.tiles.set(3, 0, TowerTile.TOWER_TILE);

	world.tiles.set(5, -2, TowerTile.TOWER_TILE);
	world.entities.add(new Chain(new Vector(5, -1), 2, world));
	world.tiles.set(5, 1, TowerTile.TOWER_TILE);

	world.tiles.set(7, -2, TowerTile.TOWER_TILE);
	world.entities.add(new Chain(new Vector(7, -1), 20, world));
	world.tiles.set(7, 19, TowerTile.TOWER_TILE);

	world.tiles.set(9, -2, TowerTile.TOWER_TILE);
	world.entities.add(new Chain(new Vector(9, -1), 3, world));

	return [world];
});
