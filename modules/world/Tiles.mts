import { Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tile } from "../tiles/Tile.mjs";
import { Camera } from "./Camera.mjs";
import { Renderer } from "./Renderer.mjs";
import { TileWithPosition, World } from "./World.mjs";

export class Tiles extends Grid<Tile> {
	constructor() {
		super(EmptyTile.EMPTY);
	}

	static getTileX(onscreenX: number) {
		return Math.floor(onscreenX / WorldData.TILE_SIZE);
	}
	static getTileY(onscreenY: number) {
		return Math.floor(onscreenY / WorldData.TILE_SIZE);
	}
	static getTileCoordinates(onscreenPosition: Vector) {
		return new Vector(
			Math.floor(onscreenPosition.x / WorldData.TILE_SIZE),
			Math.floor(onscreenPosition.y / WorldData.TILE_SIZE),
		);
	}
	static getTileSquare(tilePosition: Vector) {
		return Rectangle.square(tilePosition.x * WorldData.TILE_SIZE, tilePosition.y * WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	}
	getTileAt(onscreenPosition: Vector) {
		return this.get(Tiles.getTileCoordinates(onscreenPosition));
	}
	*getTilesAt(rectangle: Rectangle) {
		const left = Tiles.getTileX(rectangle.left);
		const right = Tiles.getTileX(rectangle.right - 1);
		const top = Tiles.getTileY(rectangle.top);
		const bottom = Tiles.getTileY(rectangle.bottom - 1);
		for(let x = left; x <= right; x ++) {
			for(let y = top; y <= bottom; y ++) {
				yield { position: new Vector(x, y), tile: this.get(x, y) };
			}
		}
	}

	angularMotionBlockers(point: Vector, direction: "clockwise" | "counterclockwise") {
		const getGridValues = (value: number) => [...new Set([
			Math.floor(value / WorldData.TILE_SIZE),
			Math.ceil(value / WorldData.TILE_SIZE) - 1,
		])];
		const xValues = getGridValues(point.x);
		const yValues = getGridValues(point.y);

		return xValues.map(x => (
			yValues.map(y => (
				this.get(x, y).angularMotionBlockers(new Vector(x, y), point, direction)
			))
		)).flat(2);
	}
	rayIntersectionDistance(rayStart: Vector, rayDirection: Vector, maxDistance: number, ignoredTiles: Tile[] = []) {
		let result = Infinity;
		let iterationsSinceFound = -Infinity;
		for(const tilePosition of GeomUtils.gridSquaresOnRay(rayStart, rayDirection, maxDistance, WorldData.TILE_SIZE)) {
			const tile = this.get(tilePosition);
			if(!ignoredTiles.includes(tile)) {
				const distance = this.get(tilePosition).rayIntersectionDistance(tilePosition, rayStart, rayDirection);
				result = Math.min(result, distance);
				if(result !== Infinity) {
					iterationsSinceFound = 0;
				}
			}
			if(iterationsSinceFound >= 3) { return result; }
			iterationsSinceFound ++;
		}
		return result;
	}
	rectIntersectionDistance(rect: Rectangle, direction: Direction, maxDistance: number) {
		const tileRect = Rectangle.boundingBox([rect, rect.translate(Vector.unit(direction).multiply(maxDistance))]);
		const tiles = [...this.getTilesAt(tileRect)];
		const distances = tiles.map(({ position, tile }) => (
			tile.rectIntersectionDistance(position, rect, direction)
		));
		return Math.min(maxDistance, ...distances);
	}
	colliding(rectangle: Rectangle, collides: (object: TileWithPosition) => boolean = () => true) {
		const tiles = [];
		for(const { position, tile } of this.getTilesAt(rectangle)) {
			if(collides({ position, tile }) && tile.intersects(rectangle, position)) {
				tiles.push({ position, tile });
			}
		}
		return tiles;
	}
	blockingMovement(collideable: Collideable, direction: Direction, hitboxes: Rectangle[], newHitboxes: Rectangle[]) {
		const tiles: { position: Vector, tile: Tile }[] = [];
		for(const hitbox of hitboxes) {
			for(const { position, tile } of this.getTilesAt(hitbox.extend("all", 1))) {
				if(
					!tiles.some(t => t.position.equals(position)) &&
					tile.blocksMovement(position, collideable, direction, hitboxes, newHitboxes)
				) { tiles.push({ position, tile}); }
			}
		}
		return tiles;
	}

	destroy(hurtbox: Rectangle, world: World, damagesTile: (tile: Tile) => boolean = () => true) {
		for(const { position } of this.getTilesAt(hurtbox)) {
			const tile = this.get(position);
			if(damagesTile(tile)) {
				world.destroyTile(position);
			}
		}
	}

	render(camera: Camera, renderer: Renderer, originalTiles: Tiles) {
		const region = camera.visibleTileRegion(0);
		for(const position of region.squares()) {
			for(const renderable of this.get(position).render(position, originalTiles)) {
				renderer.renderables.push(renderable);
			}
		}
	}

	copy() {
		const copy = new Tiles();
		for(const [tile, position] of this.entries()) {
			copy.set(position, tile);
		}
		return copy;
	}
}
