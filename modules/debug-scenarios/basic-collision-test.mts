import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { Platform } from "../tiles/Platform.mjs";
import { TowerSlope } from "../tiles/TowerSlope.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const basicCollisionScenario = new TestScenario(() => {
	const world = new World(false);

	world.tiles.fillRect(Rectangle.fromDimensions(-2, 0, 10, 1), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(2, -2, 2, 1), Platform.PLATFORM);
	world.tiles.set(0, -1, TowerSlope.SLOPE_UP_RIGHT);
	world.tiles.set(-1, -2, TowerSlope.SLOPE_UP_RIGHT);
	world.tiles.set(-2, -3, TowerSlope.SLOPE_UP_RIGHT);
	world.tiles.set(-3, -3, TowerTile.TOWER_TILE);
	world.tiles.set(-4, -6, TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(-6, -2, 5, 1), TowerTile.TOWER_TILE);

	world.tiles.set(6, -1, TowerSlope.SLOPE_UP_LEFT);
	world.tiles.set(7, -2, TowerSlope.SLOPE_UP_LEFT);
	world.tiles.set(8, -3, TowerSlope.SLOPE_UP_LEFT);
	world.tiles.set(8, -2, TowerTile.TOWER_TILE);
	world.tiles.set(9, -3, TowerTile.TOWER_TILE);


	world.tiles.set(2, -6, TowerSlope.SLOPE_UP_LEFT);
	world.tiles.set(3, -6, TowerSlope.SLOPE_UP_RIGHT);


	world.player.hitbox.y -= 100;
	return [world];
});
