import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { LaserBlock } from "../entities/LaserBlock.mjs";
import { World } from "../world/World.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { TowerSlope } from "../tiles/TowerSlope.mjs";
import { TestScenario } from "../TestScenario.mjs";

export const laserBlockSlopeScenario = new TestScenario(() => {
	const world = new World(false);

	world.tiles.fillRect(Rectangle.fromDimensions(-2, 0, 10, 6), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(-1, 1, 8, 4), EmptyTile.EMPTY);
	const laserBlock = LaserBlock.generate(new Vector(3, -1), world);
	world.entities.add(laserBlock);
	laserBlock.lasers = 2;
	laserBlock.startAngle = Math.PI;
	world.tiles.set(new Vector(2, -1), TowerSlope.SLOPE_DOWN_LEFT);
	world.tiles.set(new Vector(3, -2), TowerSlope.SLOPE_DOWN_RIGHT);

	return [world];
});

