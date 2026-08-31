import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { Octant, Octants } from "../game-utilities/Octant.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Tile } from "./Tile.mjs";

export abstract class BasicTile extends Tile {
	reflect(): BasicTile {
		return this;
	}

	contains(point: Vector, tilePosition: Vector) {
		const square = Tiles.getTileSquare(tilePosition);
		return square.contains(point);
	}
	solidOctants(tilePosition: Vector, point: Vector): Octant[] {
		return Octants.octantsOfRect(point, Tiles.getTileSquare(tilePosition));
	}
	angularMotionBlockers(tilePosition: Vector, point: Vector): (Direction | Diagonal)[] {
		const octants = this.solidOctants(tilePosition, point);
		return [...new Set(octants.flatMap(
			o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]),
		)];
	}


	intersects(rect: Rectangle, tilePosition: Vector): boolean {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		return rect.intersects(tileSquare);
	}

	addToPath(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.rect(
			position.x * WorldData.TILE_SIZE - 1,
			position.y * WorldData.TILE_SIZE - 1,
			WorldData.TILE_SIZE + 2, WorldData.TILE_SIZE + 2,
		);
	}

	abstract render(position: Vector, tiles: Tiles): Renderable[];

	rayIntersectionDistance(tilePosition: Vector, rayStart: Vector, rayDirection: Vector): number {
		return GeomUtils.rayIntersectsRectangle(rayStart, rayDirection, Tiles.getTileSquare(tilePosition));
	}
	rectIntersectionDistance(tilePosition: Vector, rect: Rectangle, direction: Direction) {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		return GeomUtils.rectIntersectionDistance(rect, direction, tileSquare);
	}
	blocksMovement(tilePosition: Vector, collideable: Collideable, direction: Direction, hitboxes: Rectangle[], newHitboxes: Rectangle[]): boolean {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		return newHitboxes.some(h => h.interiorIntersects(tileSquare));
	}
	corners(tilePosition: Vector): Vector[] {
		const square = Tiles.getTileSquare(tilePosition);
		return square.getCorners();
	}
}
