import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ChainData, WorldData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";

export class Chain extends Entity {
	tilePosition: Vector;
	height: number;

	constructor(tilePosition: Vector, height: number) {
		super();
		this.tilePosition = tilePosition;
		this.height = height;
	}

	render() {
		return [
			new Renderable(c => this.display(c), "entity"),
		];
	}
	display(canvasIO: CanvasIO) {
		const tile = Tiles.getTileSquare(this.tilePosition);
		const center = tile.center();
		for(let i = 0; i < this.height * ChainData.NUM_SEGMENTS; i ++) {
			const position = new Vector(center.x, tile.y + i * (WorldData.TILE_SIZE / ChainData.NUM_SEGMENTS));
			Chain.displaySegment(position, canvasIO);
		}
	}
	static displaySegment(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = ChainData.COLOR;
		Chain.displayThinSegment(position, canvasIO);
		Chain.displayThickSegment(position.add(0, ChainData.THIN_SEGMENT_LENGTH), canvasIO);
		Chain.displayThinSegment(position.add(0, ChainData.THICK_SEGMENT_LENGTH + ChainData.THIN_SEGMENT_LENGTH), canvasIO);
	}
	static displayThinSegment(position: Vector, canvasIO: CanvasIO) {
		canvasIO.ctx.fillRect(
			position.x - ChainData.LINE_WIDTH / 2,
			position.y,
			ChainData.LINE_WIDTH,
			ChainData.THIN_SEGMENT_LENGTH,
		);
	}
	static THICK_SEGMENT_POLY = [
		new Vector(ChainData.LINE_WIDTH / 2, -ChainData.LINE_WIDTH),
		new Vector(ChainData.LINE_WIDTH / 2 + ChainData.LINE_WIDTH, 0),
		new Vector(ChainData.LINE_WIDTH / 2 + ChainData.LINE_WIDTH, ChainData.THICK_SEGMENT_LENGTH),
		new Vector(ChainData.LINE_WIDTH / 2, ChainData.LINE_WIDTH + ChainData.THICK_SEGMENT_LENGTH),
	];
	static THICK_SEGMENT_POLY_REFLECTED = Chain.THICK_SEGMENT_POLY.map(v => v.reflectX());
	static displayThickSegment(position: Vector, canvasIO: CanvasIO) {
		canvasIO.fillPoly(...Chain.THICK_SEGMENT_POLY.map(v => v.add(position)));
		canvasIO.fillPoly(...Chain.THICK_SEGMENT_POLY_REFLECTED.map(v => v.add(position)));
	}

	update() { }


	boundingBox(): Rectangle {
		return Rectangle.fromDimensions(
			this.tilePosition.x * WorldData.TILE_SIZE,
			this.tilePosition.y * WorldData.TILE_SIZE,
			WorldData.TILE_SIZE,
			this.height * WorldData.TILE_SIZE,
		);
	}
}
