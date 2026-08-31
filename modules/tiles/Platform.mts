import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Tile } from "./Tile.mjs";

export class Platform extends Tile {
	private constructor() {
		super();
	}
	static readonly PLATFORM = new Platform();

	render(position: Vector, tiles: Tiles): Renderable[] {
		return [new Renderable(c => this.display(c, position.x, position.y, tiles), "tile")];
	}
	display(canvasIO: CanvasIO, x: number, y: number, tiles: Tiles): void {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS.tower;
		canvasIO.ctx.fillRect(
			x * WorldData.TILE_SIZE, y * WorldData.TILE_SIZE,
			WorldData.TILE_SIZE + 1, 2 * WorldData.TILE_ACCENT_INSET,
		);
		const platformLeft = (tiles.get(x - 1, y) === Platform.PLATFORM);
		const platformRight = (tiles.get(x + 1, y) === Platform.PLATFORM);
		const accentStart = platformLeft ? -1 : WorldData.TILE_ACCENT_INSET;
		const accentEnd = WorldData.TILE_SIZE- (platformRight ? -1 : WorldData.TILE_ACCENT_INSET);
		const accentY = y * WorldData.TILE_SIZE + WorldData.TILE_ACCENT_INSET;
		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.strokeLine(
			x * WorldData.TILE_SIZE + accentStart, accentY,
			x * WorldData.TILE_SIZE + accentEnd, accentY,
		);
	}

	reflect(): Platform {
		return this;
	}
	intersects() {
		return false;
	}
	angularMotionBlockers(tilePosition: Vector, point: Vector, direction: "clockwise" | "counterclockwise"): Direction[] {
		const onTop = (point.y === tilePosition.y * WorldData.TILE_SIZE);
		const left = tilePosition.x * WorldData.TILE_SIZE;
		const right = (tilePosition.x + 1) * WorldData.TILE_SIZE;
		if(direction === "clockwise") {
			return (onTop && point.x >= left && point.x < right) ? ["right"] : [];
		}
		else {
			return (onTop && point.x > left && point.x <= right) ? ["left"] : [];
		}
	}
	rayIntersectionDistance(tilePosition: Vector, rayStart: Vector, rayDirection: Vector): number {
		if(rayDirection.y <= 0) {
			return Infinity;
		}
		return GeomUtils.rayIntersectsHSegment(
			rayStart, rayDirection,
			tilePosition.y * WorldData.TILE_SIZE,
			tilePosition.x * WorldData.TILE_SIZE,
			(tilePosition.x + 1) * WorldData.TILE_SIZE,
		);
	}
	blocksMovement(tilePosition: Vector, collideable: Collideable, direction: Direction, hitboxes: Rectangle[]): boolean {
		return direction === "down" && hitboxes.some(hitbox => (
			hitbox.bottom === tilePosition.y * WorldData.TILE_SIZE
			&& hitbox.right >= tilePosition.x * WorldData.TILE_SIZE
			&& hitbox.left <= (tilePosition.x + 1) * WorldData.TILE_SIZE
		));
	}
	rectIntersectionDistance(tilePosition: Vector, rect: Rectangle, direction: Direction) {
		if(direction !== "down") {
			return Infinity;
		}
		const tileSquare = Tiles.getTileSquare(tilePosition);
		return GeomUtils.rectIntersectionDistance(rect, direction, tileSquare);
	}
	corners(tilePosition: Vector): Vector[] {
		const rect = Tiles.getTileSquare(tilePosition);
		return [new Vector(rect.left, rect.top), new Vector(rect.right, rect.top)];
	}
}
