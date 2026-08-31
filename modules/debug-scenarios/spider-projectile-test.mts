import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Spider } from "../entities/Spider.mjs";
import { World } from "../world/World.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { TestScenario } from "../TestScenario.mjs";

export const spiderProjectileScenario = new TestScenario(() => {
	const world = new World(false);

	for(const tiles of [world.tiles, world.originalTiles]) {
		tiles.fillRect(Rectangle.fromDimensions(-2, 0, 2, 6), TowerTile.TOWER_TILE);
		tiles.fillRect(Rectangle.fromDimensions(-2, 4, 5, 2), TowerTile.TOWER_TILE);

		tiles.fillRect(Rectangle.fromBounds(0, 2, 8, 9), Platform.PLATFORM);
		tiles.set(-1, 8, TowerTile.TOWER_TILE);
	}

	Spider.spawn(new Vector(-3, 3), world);
	Spider.spawn(new Vector(-1, 7), world);

	return [world];
});

