import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { SlopeTile } from "./SlopeTile.mjs";
import { TowerTile } from "./TowerTile.mjs";

export class TowerSlope extends SlopeTile {
	static SLOPE_UP_RIGHT = new TowerSlope("up-right");
	static SLOPE_UP_LEFT = new TowerSlope("up-left");
	static SLOPE_DOWN_RIGHT = new TowerSlope("down-right");
	static SLOPE_DOWN_LEFT = new TowerSlope("down-left");

	private constructor(normal: Diagonal) {
		super(normal);
	}
	static fromNormal(normal: Diagonal) {
		return {
			"up-left": TowerSlope.SLOPE_UP_LEFT,
			"up-right": TowerSlope.SLOPE_UP_RIGHT,
			"down-left": TowerSlope.SLOPE_DOWN_LEFT,
			"down-right": TowerSlope.SLOPE_DOWN_RIGHT,
		}[normal];
	}

	render(position: Vector, tiles: Tiles) {
		return [
			new Renderable(c => this.display(c, position.x, position.y), "tile"),
			new Renderable(c => this.displayAccent(position, c, tiles), "tile-accent"),
		];
	}
	display(canvasIO: CanvasIO, x: number, y: number): void {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS["tower"];
		canvasIO.ctx.beginPath();
		this.addToPath(new Vector(x, y), canvasIO);
		canvasIO.ctx.fill();
	}
	displayAccent(position: Vector, canvasIO: CanvasIO, tiles: Tiles) {
		TowerTile.displaySlopedAccent(position, canvasIO, this.normal, tiles);
	}

	reflect() {
		const reflected = Directions.reflectX[this.normal];
		return new TowerSlope(reflected);
	}
}
