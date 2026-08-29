import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Lizard } from "../entities/Lizard.mjs";
import { ThrowableTileEntity } from "../items/ThrowableTileEntity.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const lizardAdjacentTileScenario = new TestScenario(() => {
	const world = new World(false);
	world.tiles.fillRect(Rectangle.fromBounds(0, 10, 0, 5), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromBounds(0, 10, -10, -5), TowerTile.TOWER_TILE);

	let lizard, tile;
	world.entities.add(lizard = new Lizard(
		new Vector(4.5, -0.5).multiply(WorldData.TILE_SIZE),
		"right",
		125,
		3,
		world,
	));
	world.entities.add(tile = new ThrowableTileEntity(
		new Vector(4.5, -2).multiply(WorldData.TILE_SIZE),
		[],
		world,
	));

	return [world, lizard, tile];
});
