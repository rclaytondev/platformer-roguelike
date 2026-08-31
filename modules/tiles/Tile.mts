import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Octants } from "../game-utilities/Octant.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";

export abstract class Tile {
	abstract render(position: Vector, tiles: Tiles): Renderable[];
	abstract display(canvasIO: CanvasIO, x: number, y: number, tiles: Tiles): void;
	abstract copy(): Tile;
	abstract reflect(): Tile;
	abstract equals(tile: Tile): boolean;

	abstract angularMotionBlockers(tilePosition: Vector, point: Vector, direction: "clockwise" | "counterclockwise"): (Direction | Diagonal)[];
	static fullAngularMotionBlockers(tilePosition: Vector, point: Vector) {
		const rect = Rectangle.square(tilePosition.x * WorldData.TILE_SIZE, tilePosition.y * WorldData.TILE_SIZE, WorldData.TILE_SIZE);
		const octants = Octants.octantsOfRect(point, rect);
		return [...new Set(octants.flatMap(
			o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]),
		)];
		return [];
	}

	abstract intersects(rect: Rectangle, tilePosition: Vector): boolean;
	abstract rayIntersectionDistance(tilePosition: Vector, rayStart: Vector, rayDirection: Vector): number;
	abstract blocksMovement(tilePosition: Vector, collideable: Collideable, direction: Direction, hitboxes: Rectangle[], newHitboxes: Rectangle[]): boolean;
	abstract rectIntersectionDistance(tilePosition: Vector, rect: Rectangle, direction: Direction): number;
	abstract corners(tilePosition: Vector): Vector[];
}
