import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { BasicTile } from "./BasicTile.mjs";
import { SlopeTile } from "./SlopeTile.mjs";
import { Tile } from "./Tile.mjs";

export class TowerTile extends BasicTile {
	static TOWER_TILE = new TowerTile();

	private constructor() {
		super();
	}

	render(position: Vector, tiles: Tiles) {
		return [
			new Renderable(c => this.display(c, position.x, position.y), "tile"),
			new Renderable(c => this.displayAccent(position, c, tiles), "tile-accent"),
		];
	}
	displayAccent(position: Vector, canvasIO: CanvasIO, tiles: Tiles) {
		TowerTile.displayTileAccent(position, canvasIO, tiles);
	}
	display(canvasIO: CanvasIO, x: number, y: number): void {
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS["tower"];
		canvasIO.ctx.beginPath();
		this.addToPath(new Vector(x, y), canvasIO);
		canvasIO.ctx.fill();
	}

	static displaySlopedAccent(position: Vector, canvasIO: CanvasIO, normal: Diagonal, tiles: Tiles) {
		const inwardNormal = Vector.gridUnit(Directions.opposite[normal]);
		const tangent = inwardNormal.rotate(90);
		const center = position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE);

		const [adjacentDirection1, perpendicularDirection1] = ({
			"up-right": ["left", "up"],
			"up-left": ["down", "left"],
			"down-right": ["up", "right"],
			"down-left": ["right", "down"],
		} as const)[normal];
		const distance1 = this.getSlopeAccentLength(position, adjacentDirection1, perpendicularDirection1, tiles);

		const [adjacentDirection2, perpendicularDirection2] = ({
			"up-right": ["down", "right"],
			"up-left": ["right", "up"],
			"down-right": ["left", "down"],
			"down-left": ["up", "left"],
		} as const)[normal];
		const distance2 = this.getSlopeAccentLength(position, adjacentDirection2, perpendicularDirection2, tiles);


		const endpoint1 = center.add(inwardNormal.multiply(WorldData.TILE_ACCENT_INSET / Math.SQRT2)).add(tangent.normalize().multiply(distance1));
		const endpoint2 = center.add(inwardNormal.multiply(WorldData.TILE_ACCENT_INSET / Math.SQRT2)).subtract(tangent.normalize().multiply(distance2));

		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "round";
		canvasIO.strokeLine(endpoint1.x, endpoint1.y, endpoint2.x, endpoint2.y);

		const directions = TowerTile.slopeEdges(normal);
		for(const [edge, direction] of [directions, [...directions].reverse()]) {
			const edgeCenter = center.add(Vector.unit(edge).multiply(WorldData.TILE_ACCENT_RADIUS));
			if(!TowerTile.isEdgeBasicSolid(tiles.get(position.add(Vector.unit(edge))), Directions.opposite[edge])) {
				const vertex1 = edgeCenter.add(Vector.unit(direction).multiply(-(WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2))));
				const vertex2 = edgeCenter.add(Vector.unit(direction).multiply(TowerTile.getAccentLength(position, edge, direction, tiles)));
				canvasIO.strokeLine(vertex1.x, vertex1.y, vertex2.x, vertex2.y);
			}
		}
	}
	static getSlopeAccentLength(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction, tiles: Tiles) {
		const angle = TowerTile.angle(position, adjacentDirection, perpendicularDirection, false, tiles);
		const defaultLength = WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2);
		return ({
			0: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET * (1 + Math.SQRT2),
			45: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET,
			90: WorldData.TILE_SIZE / Math.SQRT2 - WorldData.TILE_ACCENT_INSET / 2,
			135: WorldData.TILE_SIZE * Math.SQRT2 / 2,
			180: WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			225: WorldData.TILE_SIZE / Math.SQRT2 + WorldData.TILE_ACCENT_INSET,
		} as { [key: number]: number } )[angle] ?? defaultLength;
	}
	static getAccentLength(position: Vector, side: Direction, direction: Direction, tiles: Tiles): number {
		const angle = TowerTile.angle(position, direction, side, false, tiles);
		const defaultLength = WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 + 1);
		return ({
			0: WorldData.TILE_ACCENT_RADIUS,
			45: WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			90: WorldData.TILE_SIZE / 2,
			135: WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET * (Math.SQRT2 - 1),
			180: WorldData.TILE_SIZE / 2 + WorldData.TILE_ACCENT_INSET,
		} as { [ key: number]: number } )[angle] ?? defaultLength;
	}
	static displayTileAccent(position: Vector, canvasIO: CanvasIO, tiles: Tiles) {
		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.ctx.lineCap = "butt";

		const center = position.multiply(WorldData.TILE_SIZE).add(WorldData.TILE_SIZE / 2, WorldData.TILE_SIZE / 2);
		for(const side of Directions.DIRECTIONS) {
			const adjacentTile = tiles.get(position.add(Vector.unit(side)));
			if(TowerTile.isEdgeBasicSolid(adjacentTile, Directions.opposite[side])) { continue; }

			const edgeCenter = center.add(Vector.unit(side).multiply(WorldData.TILE_ACCENT_RADIUS));
			for(const direction of [Directions.rotateClockwise[side], Directions.rotateCounterclockwise[side]] as Direction[]) {
				const length = this.getAccentLength(position, side, direction, tiles);
				canvasIO.strokeLine(
					edgeCenter.x, edgeCenter.y,
					edgeCenter.x + Vector.unit(direction).x * length,
					edgeCenter.y + Vector.unit(direction).y * length,
				);
			}
		}
	}

	static slopeEdges(normal: Diagonal) {
		return ({
			"up-right": ["left", "down"],
			"up-left": ["right", "down"],
			"down-right": ["left", "up"],
			"down-left": ["right", "up"],
		} as const)[normal];
	}
	static isEdgeBasicSolid(tile: Tile, direction: Direction) {
		if(tile instanceof SlopeTile) {
			const edges = TowerTile.slopeEdges(tile.normal);
			return (edges as readonly Direction[]).includes(direction);
		}
		return tile instanceof BasicTile;
	}

	static angle(position: Vector, adjacentDirection: Direction, perpendicularDirection: Direction, empty: boolean = true, tiles: Tiles) {
		/* Returns the angle before encountering a solid/empty, when first moving in `adjacentDirection` and then in `perpendicularDirection` and then in a circle after that. */
		const tile = tiles.get(position);
		const adjacent = tiles.get(position.add(Vector.unit(adjacentDirection)));
		const diagonal = tiles.get(position.add(Vector.unit(adjacentDirection)).add(Vector.unit(perpendicularDirection)));
		const perpendicular = tiles.get(position.add(Vector.unit(perpendicularDirection)));
		if(TowerTile.isEdgeBasicSolid(adjacent, Directions.opposite[adjacentDirection]) === empty) {
			return 0;
		}
		if(TowerTile.isEdgeBasicSolid(adjacent, perpendicularDirection) === empty && adjacent instanceof SlopeTile) {
			return 45;
		}
		if(TowerTile.isEdgeBasicSolid(diagonal, Directions.opposite[perpendicularDirection]) === empty) {
			return 90;
		}
		if(TowerTile.isEdgeBasicSolid(diagonal, Directions.opposite[adjacentDirection]) === empty && diagonal instanceof SlopeTile) {
			return 135;
		}
		if(TowerTile.isEdgeBasicSolid(perpendicular, adjacentDirection) === empty) {
			return 180;
		}
		if(TowerTile.isEdgeBasicSolid(perpendicular, Directions.opposite[perpendicularDirection]) === empty && perpendicular instanceof SlopeTile) {
			return 225;
		}
		if(TowerTile.isEdgeBasicSolid(tile, perpendicularDirection) === empty) {
			return 270;
		}
		if(TowerTile.isEdgeBasicSolid(tile, adjacentDirection) === empty && tile instanceof SlopeTile) {
			return 315;
		}
		return 360;
	}
}
