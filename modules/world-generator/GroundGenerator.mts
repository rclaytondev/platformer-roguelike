import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldGeneratorData } from "../constants/GameData.mjs";
import { StoneTile, StoneTileRenderer } from "../tiles/StoneTile.mjs";
import { World } from "../world/World.mjs";
import { FloorZero } from "./FloorZero.mjs";
import { WorldGenerationSegment } from "./WorldGenerationSegment.mjs";

export class GroundGenerator extends WorldGenerationSegment {
	generated: boolean = false;

	shouldGenerate(world: World): boolean {
		if(this.generated) { return false; }
		const floorZero = FloorZero.getRegion();
		const ground = floorZero.y + WorldGeneratorData.GROUND_OFFSET;
		return world.player.hitbox.y > ground - WorldGeneratorData.GENERATION_DISTANCE;
	}

	generate(world: World): void {
		const floorZero = FloorZero.getRegion();
		const y = floorZero.y + WorldGeneratorData.GROUND_OFFSET;

		const rectLeft = Rectangle.fromDimensions(
			floorZero.right, y,
			WorldGeneratorData.TOWER_OUTSIDE_WIDTH, WorldGeneratorData.GROUND_DEPTH,
		);
		const rectRight = Rectangle.fromDimensions(
			floorZero.x - WorldGeneratorData.TOWER_OUTSIDE_WIDTH, y,
			WorldGeneratorData.TOWER_OUTSIDE_WIDTH, WorldGeneratorData.GROUND_DEPTH,
		);
		const rectBelow = Rectangle.fromBounds(
			floorZero.left, floorZero.right,
			floorZero.bottom, y + WorldGeneratorData.GROUND_DEPTH,
		);
		world.tiles.fillRect(rectLeft, StoneTile.STONE_TILE);
		world.tiles.fillRect(rectRight, StoneTile.STONE_TILE);
		world.tiles.fillRect(rectBelow, StoneTile.STONE_TILE);
		if(!world.staticEntities.entitiesList.some(e => e instanceof StoneTileRenderer)) {
			world.staticEntities.add(new StoneTileRenderer()); // REFACTOR: you shouldn't have to add a renderer every time you add stone tiles
		}
	}
}
