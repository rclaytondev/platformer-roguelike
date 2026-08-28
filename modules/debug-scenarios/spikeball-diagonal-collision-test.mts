import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Spikeball } from "../entities/Spikeball.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerSlope } from "../tiles/TowerSlope.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const spikeballDiagonalCollisionScenario = new TestScenario(() => {
	const world = new World(false);

	world.tiles.set(0, 0, TowerTile.TOWER_TILE);
	world.tiles.set(5, 5, TowerTile.TOWER_TILE);

	world.tiles.set(-5, 5, TowerSlope.SLOPE_UP_RIGHT);

	world.entities.add(Spikeball.fromCenter(
		new Vector(3, 3).multiply(WorldData.TILE_SIZE),
		"down-right",
		world,
	));
	world.entities.add(Spikeball.fromCenter(
		new Vector(-2.5, 3.5).multiply(WorldData.TILE_SIZE),
		"down-left",
		world,
	));



	world.entities.add(Spikeball.fromCenter(
		new Vector(3, -3).multiply(WorldData.TILE_SIZE),
		"down-right",
		world,
	));
	world.entities.add(Spikeball.fromCenter(
		new Vector(3 + 3, -3 + 3).multiply(WorldData.TILE_SIZE),
		"up-left",
		world,
	));

	return [world];
});

