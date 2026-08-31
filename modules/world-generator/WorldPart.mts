import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { FixedEntitySpawner } from "../level-generator/FixedEntitySpawner.mjs";
import { TILE_TYPES } from "../tiles/TileIDs.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { World } from "../world/World.mjs";

export class WorldPart {
	tiles: Tiles;
	entities: FixedEntitySpawner[];

	static parse(tilesData: number[][], entitiesData: FixedEntitySpawner[]) {
		const tiles = WorldPart.parseTiles(tilesData);
		return new WorldPart(tiles, entitiesData);
	}
	static parseTiles(tilesData: number[][]) {
		const tiles = new Tiles();
		for(let y = 0; y < tilesData.length; y ++) {
			for(let x = 0; x < tilesData[y].length; x ++) {
				const tileID = tilesData[y][x];
				if(tileID < 0 || tileID >= TILE_TYPES.length || tileID % 1 !== 0) {
					throw new Error(`Encountered invalid tile ID of${tileID} while parsing tileset.`);
				}
				const tile = TILE_TYPES[tileID];
				tiles.set(x, y, tile);
			}
		}
		return tiles;
	}

	constructor(tiles: Tiles = new Tiles(), entities: FixedEntitySpawner[] = []) {
		this.tiles = tiles;
		this.entities = entities;
	}

	add(world: World, tileOffset: Vector) {
		for(const [tile, position] of this.tiles.entries()) {
			world.addOriginalTile(position.add(tileOffset), tile);
		}
		for(const entity of this.entities) {
			entity.spawn(tileOffset, world);
		}
	}

	extend(direction: Direction, amount: number) {
		/* Copies the first/last row/column to increase the size by the specified amount. */
		const copy = new WorldPart(this.tiles.copy(), this.entities);

		const boundingBox = this.tiles.boundingBox();
		if(Directions.isHorizontal(direction)) {
			const sourceX = (direction === "left") ? boundingBox.left : (boundingBox.right - 1);
			for(let i = 0; i < amount; i ++) {
				const targetX = (direction === "left") ? (boundingBox.left - i - 1) : (boundingBox.right + i);
				for(let y = boundingBox.top; y < boundingBox.bottom; y ++) {
					copy.tiles.set(targetX, y, this.tiles.get(sourceX, y));
				}
			}
		}
		else {
			const sourceY = (direction === "up") ? boundingBox.top : (boundingBox.bottom - 1);
			for(let i = 0; i < amount; i ++) {
				const targetY = (direction === "up") ? (boundingBox.top - i - 1) : (boundingBox.bottom + i);
				for(let x = boundingBox.left; x < boundingBox.right; x ++) {
					copy.tiles.set(x, targetY, this.tiles.get(x, sourceY));
				}
			}
		}
		return copy;
	}
}
