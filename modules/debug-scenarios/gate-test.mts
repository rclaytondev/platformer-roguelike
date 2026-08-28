import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Gate } from "../entities/Gate.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";

/*
This scenario is a regression test for a bug: if the player goes partially past a horizontal gate while in a different column, then goes into the column containing the gate and goes fully past, the gate will toggle when it shouldn't.
*/

export const gateScenario = new TestScenario(() => {
	const world = new World(false);

	world.tiles.fillRect(Rectangle.fromDimensions(0, 0, 4, 3), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(-3, -5, 3, 10), TowerTile.TOWER_TILE);
	world.entities.add(Gate.atTile(new Vector(-4, -5), "left", false, world));
	world.tiles.set(-5, -5, TowerTile.TOWER_TILE);

	world.tiles.set(6, 0, TowerTile.TOWER_TILE);
	world.entities.add(Gate.atTile(new Vector(4, 0), "right", true, world));
	world.entities.add(Gate.atTile(new Vector(5, 0), "left", true, world));
	world.tiles.set(4, 1, TowerTile.TOWER_TILE);

	return [world];
});

