import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Lizard } from "../entities/Lizard.mjs";
import { CrawlingState, Spider } from "../entities/Spider.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerSlope } from "../tiles/TowerSlope.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

export const showcaseScenario = new TestScenario(() => {
	const world = new World(false);
	world.tiles.set(0, 1, TowerTile.TOWER_TILE);

	const lizard = new Lizard(new Vector(325, 25), "right", 300, 0, world);
	lizard.mouthAngle = 15;
	lizard.joints.push({ position: new Vector(275, 25), direction: "down" });
	lizard.joints.push({ position: new Vector(275, -75), direction: "right" });
	lizard.joints.push({ position: new Vector(175, -75), direction: "right" });
	lizard.legPosition = -5;
	lizard.fireSpawner.startFire(120);
	world.addEntityIfEmpty(lizard);

	// world.tiles.set(6, -2, TowerTile.TOWER_TILE);

	// const laserBlock = LaserBlock.generate(new Vector(4, 0));
	// laserBlock.setSpeed(0);
	// laserBlock.startAngle = -Math.PI / 6;
	// world.addEntityIfEmpty(laserBlock);

	world.addOriginalTile(new Vector(4, 0), TowerTile.TOWER_TILE);
	world.addOriginalTile(new Vector(4, -1), TowerSlope.SLOPE_UP_RIGHT);

	world.addOriginalTile(new Vector(7, -2), TowerTile.TOWER_TILE);
	world.addOriginalTile(new Vector(7, -1), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(4, 1, 3, 1), TowerTile.TOWER_TILE);

	Spider.spawn(new Vector(6, -2), world);
	const spider = [...world.entities].find(e => e instanceof Spider);
	(spider!.movement as CrawlingState).direction = "counterclockwise";


	world.tiles.fillRect(Rectangle.fromDimensions(3, -3, 5, 1), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(3, -1, 1, 3), TowerTile.TOWER_TILE);
	world.originalTiles = world.tiles.copy();

	return [world];
});

