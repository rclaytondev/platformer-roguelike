import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { SpikeballBlock } from "../entities/SpikeballBlock.mjs";
import { World } from "../world/World.mjs";
import { TestScenario } from "../TestScenario.mjs";
import { SpikeballBlockData } from "../constants/GameData.mjs";


export const spikeballScenario = new TestScenario(() => {
	const world = new World(false);

	world.tiles.fillRect(Rectangle.fromDimensions(-2, -3, 10, 6), TowerTile.TOWER_TILE);
	world.tiles.fillRect(Rectangle.fromDimensions(-1, -2, 8, 4), EmptyTile.EMPTY);
	world.tiles.set(5, -2, TowerTile.TOWER_TILE);
	world.entities.add(SpikeballBlock.atTile(new Vector(5, -1), SpikeballBlockData.PATTERNS[0], world));

	return [world];
});

