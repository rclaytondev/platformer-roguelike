import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { StaticEntity } from "../game-utilities/StaticEntity.mjs";
import { Camera } from "../world/Camera.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";
import { BasicTile } from "./BasicTile.mjs";
import { StoneSlope } from "./StoneSlope.mjs";

export class StoneTile extends BasicTile {
	static STONE_TILE = new StoneTile();

	private constructor() {
		super();
	}

	static distance(v1: Vector, v2: Vector) {
		return GeomUtils.toroidalDistance(v1, v2, WorldData.STONE_PATTERN_WIDTH, WorldData.STONE_PATTERN_HEIGHT);
	}
	static initializePoints() {
		return RandomUtils.randomEvenlySpaced({
			generate: () => RandomUtils.randomInRect(Rectangle.fromDimensions(0, 0, WorldData.STONE_PATTERN_WIDTH, WorldData.STONE_PATTERN_HEIGHT)),
			metric: StoneTile.distance,
			amount: WorldData.STONE_PATTERN_WIDTH * WorldData.STONE_PATTERN_HEIGHT * WorldData.STONE_LINE_AMOUNT,
			trials: WorldData.STONE_LINE_EVENNESS,
		});
	}
	static initializeLines() {
		const points = StoneTile.initializePoints();
		const lines = [];
		for(const point of points) {
			const others = points.filter(p => p !== point).sort((a, b) => StoneTile.distance(a, point) - StoneTile.distance(b, point));
			for(const otherPoint of others.slice(0, WorldData.STONE_CONNECTIONS)) {
				const closestX = ArrayUtils.minValue(
					[otherPoint.x, otherPoint.x - WorldData.STONE_PATTERN_WIDTH, otherPoint.x + WorldData.STONE_PATTERN_WIDTH],
					x => MathUtils.dist(x, point.x),
				);
				const closestY = ArrayUtils.minValue(
					[otherPoint.y, otherPoint.y - WorldData.STONE_PATTERN_HEIGHT, otherPoint.y + WorldData.STONE_PATTERN_HEIGHT],
					y => MathUtils.dist(y, point.y),
				);
				lines.push({ point1: point, point2: new Vector(closestX, closestY) });
			}
		}
		return lines;
	}
	static linesImage: HTMLCanvasElement | null = null;
	static initializeLinesImage() {
		if(StoneTile.linesImage) {
			return StoneTile.linesImage;
		}
		const lines = StoneTile.initializeLines();
		const box = Rectangle.boundingBox(lines.flatMap(l => [l.point1, l.point2]));

		const canvasIO = new CanvasIO();
		canvasIO.canvas.width = box.width;
		canvasIO.canvas.height = box.height;
		canvasIO.ctx.fillStyle = WorldData.TILE_COLORS.stone;
		canvasIO.ctx.fillRect(0, 0, canvasIO.canvas.width, canvasIO.canvas.height);
		canvasIO.ctx.strokeStyle = WorldData.STONE_LINE_COLOR;
		canvasIO.ctx.lineWidth = WorldData.STONE_LINE_THICKNESS;
		for(const { point1, point2 } of lines) {
			canvasIO.pointedLine(
				point1.x - box.left, point1.y - box.top,
				point2.x - box.left, point2.y - box.top,
			);
		}
		StoneTile.linesImage = canvasIO.canvas;
		return canvasIO.canvas;
	}

	static displayStoneTiles(world: World, canvasIO: CanvasIO, visibleTileRegion: Rectangle) {
		canvasIO.ctx.save();
		canvasIO.ctx.beginPath();
		for(let x = visibleTileRegion.left; x < visibleTileRegion.right; x ++) {
			for(let y = visibleTileRegion.top; y < visibleTileRegion.bottom; y ++) {
				const tile = world.tiles.get(x, y);
				if(tile instanceof StoneTile || tile instanceof StoneSlope) {
					tile.addToPath(new Vector(x, y), canvasIO);
				}
			}
		}
		canvasIO.ctx.clip();

		const patternRegion = visibleTileRegion.scale(
			WorldData.TILE_SIZE / WorldData.STONE_PATTERN_WIDTH,
			WorldData.TILE_SIZE / WorldData.STONE_PATTERN_HEIGHT,
		);
		for(let x = Math.floor(patternRegion.left - 1); x < patternRegion.right; x ++) {
			for(let y = Math.floor(patternRegion.top - 1); y < patternRegion.bottom; y ++) {
				canvasIO.ctx.drawImage(
					StoneTile.initializeLinesImage(),
					x * WorldData.STONE_PATTERN_WIDTH,
					y * WorldData.STONE_PATTERN_HEIGHT,
				);
			}
		}
		canvasIO.ctx.restore();
	}

	render() { return []; }
	display() { }
}

export class StoneTileRenderer extends StaticEntity {
	update() {}

	render(world: World, camera: Camera) {
		return [
			new Renderable(c => StoneTile.displayStoneTiles(world, c, camera.visibleTileRegion()), "tile"),
		];
	}
}
