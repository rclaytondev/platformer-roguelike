import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Lizard } from "../entities/Lizard.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const lizardHeadOnCollisionScenario = new TestScenario(() => {
	const world = new World(false);
	world.tiles.fillRect(Rectangle.fromBounds(0, 10, 0, 5), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromBounds(0, 10, -10, -5), TowerTile.TOWER_TILE);

	let lizard1, lizard2;
	world.entities.add(lizard1 = new Lizard(
		new Vector(4.5, -0.5).multiply(WorldData.TILE_SIZE),
		"right",
		125,
		3,
		world,
	));
	world.entities.add(lizard2 = new Lizard(
		new Vector(7.5, -0.5).multiply(WorldData.TILE_SIZE),
		"left",
		125,
		3,
		world,
	));

	return [world, lizard1, lizard2];
});
