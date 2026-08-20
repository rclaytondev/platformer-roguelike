import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ChainData, RoomData, WorldData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { World } from "../world/World.mjs";

export class Chain extends Entity {
	tilePosition: Vector;
	height: number;
	isClimbed: boolean = false;

	constructor(tilePosition: Vector, height: number) {
		super();
		this.tilePosition = tilePosition;
		this.height = height;
	}

	static getChainAt(tilePosition: Vector, world: World) {
		const tileSquare = Tiles.getTileSquare(tilePosition);
		const chain = [...world.entities.possiblyIntersecting(tileSquare)]
			.find(c => c instanceof Chain && c.climbRegion().interiorIntersects(tileSquare)) as Chain | undefined;
		return chain ?? null;
	}
	static isChainAt(tilePosition: Vector, world: World) {
		return Chain.getChainAt(tilePosition, world) !== null;
	}

	render() {
		return [
			new Renderable(c => this.display(c), "background-entity"),
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

	update(world: World) {
		if(this.isClimbed && !world.player.hitbox.intersects(this.climbRegion())) {
			this.isClimbed = false;
		}

		const tileAbove = world.tiles.get(this.tilePosition.add(0, -1));
		if(tileAbove === EmptyTile.EMPTY) {
			world.entities.delete(this);
		}
	}


	boundingBox(): Rectangle {
		return Rectangle.fromDimensions(
			this.tilePosition.x * WorldData.TILE_SIZE,
			this.tilePosition.y * WorldData.TILE_SIZE,
			WorldData.TILE_SIZE,
			this.height * WorldData.TILE_SIZE,
		);
	}
	climbRegion() {
		const centerX = (this.tilePosition.x + 1/2) * WorldData.TILE_SIZE;
		return Rectangle.fromDimensions(
			centerX - ChainData.CLIMB_WIDTH / 2,
			this.tilePosition.y * WorldData.TILE_SIZE,
			ChainData.CLIMB_WIDTH,
			this.height * WorldData.TILE_SIZE,
		);
	}

	copy() {
		return new Chain(this.tilePosition.clone(), this.height);
	}
	reflect() {
		return new Chain(
			new Vector(RoomData.SIZE - this.tilePosition.x - 1, this.tilePosition.y),
			this.height,
		);
	}
	copyAndTranslate(amount: Vector) {
		return new Chain(
			this.tilePosition.add(amount.divide(WorldData.TILE_SIZE)),
			this.height,
		);
	}
}
