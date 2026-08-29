import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Lizard } from "../entities/Lizard.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const lizardFireScenario = new TestScenario(() => {
	const world = new World(false);

	world.tiles.fillRect(Rectangle.fromDimensions(-2, 0, 10, 10), TowerTile.TOWER_TILE);
	world.entities.add(new Lizard(new Vector(3.5 * WorldData.TILE_SIZE, -0.5 * WorldData.TILE_SIZE), "left", 300, 3, world));
	world.tiles.fillRect(Rectangle.fromBounds(1, 2, -5, 1), TowerTile.TOWER_TILE);
	world.player.hitbox.x += WorldData.TILE_SIZE - world.player.hitbox.width;

	return [world];
});

