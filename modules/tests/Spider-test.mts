import { assert } from "chai";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { PointOnSurface } from "../entities/Spider.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { World } from "../world/World.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { InvisibleRectangle } from "../game-utilities/physics-engine/InvisibleRectangle.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Platform } from "../tiles/Platform.mjs";

// describe("PointOnSurface.surfaceEndDistanceCW", () => {
// 	it("can return distance to the end of a tile when on the left edge", () => {
// 		const world = new World(false);
// 		const tile = TowerTile.TOWER_TILE("full");
// 		world.tiles.set(1, 2, tile);
// 		const point = new PointOnSurface(new Vector(WorldData.TILE_SIZE, 2 * WorldData.TILE_SIZE + 10), "left");
// 		const distance = point.surfaceEndDistanceCW(world);
// 		assert.equal(distance, 10);
// 	});
// });

describe("Tiles.angularMotionBlockers", () => {
	it("works for corners of tiles", () => {
		const tiles = new Tiles();
		tiles.set(0, 0, TowerTile.TOWER_TILE);

		const octantsTopLeft = tiles.angularMotionBlockers(new Vector(0, 0), "clockwise");
		assert.sameMembers(octantsTopLeft, ["right", "down-right", "down"]);

		const octantsTopRight = tiles.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, 0), "clockwise");
		assert.sameMembers(octantsTopRight, ["down", "down-left", "left"]);

		const octantsBottomLeft = tiles.angularMotionBlockers(new Vector(0, WorldData.TILE_SIZE), "clockwise");
		assert.sameMembers(octantsBottomLeft, ["up", "up-right", "right"]);

		const octantsBottomRight = tiles.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, WorldData.TILE_SIZE), "clockwise");
		assert.sameMembers(octantsBottomRight, ["left", "up-left", "up"]);
	});
	it("returns an empty list when the point is not on the edge or corner of any solid", () => {
		const tiles = new Tiles();
		tiles.set(0, 0, TowerTile.TOWER_TILE);

		const octants1 = tiles.angularMotionBlockers(new Vector(-1, 0), "clockwise");
		const octants2 = tiles.angularMotionBlockers(new Vector(0, -1), "clockwise");
		assert.isEmpty(octants1);
		assert.isEmpty(octants2);
	});
	it("returns a list containing all eight directions when the point is inside a tile", () => {
		const tiles = new Tiles();
		tiles.set(0, 0, TowerTile.TOWER_TILE);

		const octants = tiles.angularMotionBlockers(new Vector(1, 1), "clockwise");
		assert.sameMembers(octants, [...Directions.DIRECTIONS, ...Directions.DIAGONALS]);
	});
	it("works when the point is on an edge of a tile", () => {
		const tiles = new Tiles();
		tiles.set(0, 0, TowerTile.TOWER_TILE);

		const octantsTop = tiles.angularMotionBlockers(new Vector(1, 0), "clockwise");
		assert.sameMembers(octantsTop, ["right", "down-right", "down", "down-left", "left"]);

		const octantsRight = tiles.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, 1), "clockwise");
		assert.sameMembers(octantsRight, ["down", "down-left", "left", "up-left", "up"]);

		const octantsBottom = tiles.angularMotionBlockers(new Vector(1, WorldData.TILE_SIZE), "clockwise");
		assert.sameMembers(octantsBottom, ["left", "up-left", "up", "up-right", "right"]);

		const octantsLeft = tiles.angularMotionBlockers(new Vector(0, 1), "clockwise");
		assert.sameMembers(octantsLeft, ["up", "up-right", "right", "down-right", "down"]);
	});
});
describe("Entitites.angularMotionBlockers", () => {
	it("works for corners of collideables", () => {
		const world = new World(false);
		const entities = world.entities;
		entities.add(new InvisibleRectangle(Rectangle.square(0, 0, WorldData.TILE_SIZE), world));

		const octantsTopLeft = entities.angularMotionBlockers(new Vector(0, 0));
		assert.sameMembers(octantsTopLeft, ["right", "down-right", "down"]);

		const octantsTopRight = entities.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, 0));
		assert.sameMembers(octantsTopRight, ["down", "down-left", "left"]);

		const octantsBottomLeft = entities.angularMotionBlockers(new Vector(0, WorldData.TILE_SIZE));
		assert.sameMembers(octantsBottomLeft, ["up", "up-right", "right"]);

		const octantsBottomRight = entities.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, WorldData.TILE_SIZE));
		assert.sameMembers(octantsBottomRight, ["left", "up-left", "up"]);
	});
	it("returns a list containing all eight directions when the point is inside a collideable", () => {
		const world = new World(false);
		const entities = world.entities;
		entities.add(new InvisibleRectangle(Rectangle.square(0, 0, WorldData.TILE_SIZE), world));

		const octants = entities.angularMotionBlockers(new Vector(1, 1));
		assert.sameMembers(octants, [...Directions.DIRECTIONS, ...Directions.DIAGONALS]);
	});
	it("works when the point is on an edge of a collideable", () => {
		const world = new World(false);
		const entities = world.entities;
		entities.add(new InvisibleRectangle(Rectangle.square(0, 0, WorldData.TILE_SIZE), world));

		const octantsTop = entities.angularMotionBlockers(new Vector(1, 0));
		assert.sameMembers(octantsTop, ["right", "down-right", "down", "down-left", "left"]);

		const octantsRight = entities.angularMotionBlockers(new Vector(WorldData.TILE_SIZE, 1));
		assert.sameMembers(octantsRight, ["down", "down-left", "left", "up-left", "up"]);

		const octantsBottom = entities.angularMotionBlockers(new Vector(1, WorldData.TILE_SIZE));
		assert.sameMembers(octantsBottom, ["left", "up-left", "up", "up-right", "right"]);

		const octantsLeft = entities.angularMotionBlockers(new Vector(0, 1));
		assert.sameMembers(octantsLeft, ["up", "up-right", "right", "down-right", "down"]);
	});
});

describe("PointOnSurface.move1Pixel", () => {
	it("works when moving from a tile to an entity", () => {
		const world = new World(false);
		world.tiles.set(0, 0, TowerTile.TOWER_TILE);
		world.entities.add(new InvisibleRectangle(Rectangle.fromDimensions(10, -10, 10, 10), world));

		const point = new PointOnSurface(new Vector(10, 0), "up");
		const next = point.move1Pixel(new InvisibleRectangle(Rectangle.fromDimensions(-100, -100, 1, 1), world), world, "clockwise");
		assert.isNotNull(next);
		assert.deepEqual(next, new PointOnSurface(new Vector(10, -1), "left"));
	});
	it("works when moving from a tile to an entity counterclockwise", () => {
		const world = new World(false);
		world.tiles.set(0, 0, TowerTile.TOWER_TILE);
		world.entities.add(new InvisibleRectangle(Rectangle.fromDimensions(10, -10, 10, 10), world));

		const point = new PointOnSurface(new Vector(10, 0), "up");
		const next = point.move1Pixel(new InvisibleRectangle(Rectangle.fromDimensions(-100, -100, 1, 1), world), world, "counterclockwise");
		assert.isNotNull(next);
		assert.deepEqual(next, new PointOnSurface(new Vector(9, 0), "up"));
	});
});
describe("PointOnSurface.move", () => {
	it("returns the distance until reaching a corner", () => {
		const world = new World(false);
		world.tiles.set(new Vector(0, 0), TowerTile.TOWER_TILE);

		const point = new PointOnSurface(new Vector(5, 0), "up");
		const [distance, newPoint] = point.move(null, world, "clockwise", 2 * WorldData.TILE_SIZE);
		assert.equal(distance, WorldData.TILE_SIZE - 5);
		assert.equal(newPoint.normal, "right");
	});
	it("works when there is a corner of a tile that is not a corner of the surface due to an adjacent tile", () => {
		const world = new World(false);
		world.tiles.set(new Vector(0, 0), TowerTile.TOWER_TILE);
		world.tiles.set(new Vector(1, 0), TowerTile.TOWER_TILE);

		const point = new PointOnSurface(new Vector(5, 0), "up");
		const [distance, newPoint] = point.move(null, world, "clockwise", 2 * WorldData.TILE_SIZE);
		assert.equal(distance, 2 * WorldData.TILE_SIZE - 5);
		assert.equal(newPoint.normal, "right");
	});
	it("works when stopping due to reaching the end of a platform", () => {
		const world = new World(false);
		world.tiles.set(0, 0, TowerTile.TOWER_TILE);
		world.tiles.set(1, 0, Platform.PLATFORM);

		const point = new PointOnSurface(new Vector(5, 0), "up");
		const [distance, newPoint] = point.move(null, world, "clockwise", 4 * WorldData.TILE_SIZE);
		assert.equal(distance, 2 * WorldData.TILE_SIZE - 5);
		assert.equal(newPoint.normal, "up");
	});
	it("returns the maximum distance and the current normal when there is no turn up to the maximum distance", () => {
		const world = new World(false);
		world.tiles.set(new Vector(0, 0), TowerTile.TOWER_TILE);
		world.tiles.set(new Vector(1, 0), TowerTile.TOWER_TILE);

		const point = new PointOnSurface(new Vector(5, 0), "up");
		const [distance, newPoint] = point.move(null, world, "clockwise", WorldData.TILE_SIZE);
		assert.equal(distance, WorldData.TILE_SIZE);
		assert.equal(newPoint.normal, "up");
	});
	it("works when there are overlapping entities that are an odd number of pixels away", () => {
		/* Overlapping entities are allowed in rare cases (e.g. spikeballs being spawned) */
		const world = new World(false);
		world.entities.add(new InvisibleRectangle(Rectangle.fromBounds(-20, 0, 0, 20), world));
		world.entities.add(new InvisibleRectangle(Rectangle.fromBounds(-10, 10, 10, 30), world));

		const point = new PointOnSurface(new Vector(0, 5), "right");
		const [distance, newPoint] = point.move(null, world, "clockwise", 10, true);

		assert.equal(distance, 5);
		assert.equal(newPoint.normal, "up");
	});
	it("works when there are overlapping entities that are an even number of pixels away", () => {
		const world = new World(false);
		world.entities.add(new InvisibleRectangle(Rectangle.fromBounds(-20, 0, 0, 20), world));
		world.entities.add(new InvisibleRectangle(Rectangle.fromBounds(-10, 10, 10, 30), world));

		const point = new PointOnSurface(new Vector(0, 6), "right");
		const [distance, newPoint] = point.move(null, world, "clockwise", 10, true);

		assert.equal(distance, 4);
		assert.equal(newPoint.normal, "up");
	});
	it("works when encountering an entity that is partway through a platform", () => {
		const world = new World(false);
		world.tiles.set(0, 0, Platform.PLATFORM);
		world.entities.add(new InvisibleRectangle(Rectangle.fromBounds(10, 20, -10, 10), world));

		const point = new PointOnSurface(new Vector(0, 0), "up");
		const [distance, newPoint] = point.move(null, world, "clockwise", 50, true);

		assert.equal(distance, 10);
		assert.equal(newPoint.normal, "left");
	});

	it("works when moving a fixed distance and the point has just gone past a corner", () => {
		const world = new World(false);
		world.tiles.set(new Vector(0, 0), TowerTile.TOWER_TILE);
		world.tiles.set(new Vector(1, 0), TowerTile.TOWER_TILE);

		const point = new PointOnSurface(new Vector(0, 0), "up");
		const [distance, newPoint] = point.move(null, world, "clockwise", 10, false);
		assert.equal(distance, 10);
		assert.equal(newPoint.normal, "up");
		assert.deepEqual(newPoint.position, new Vector(10, 0));
	});
	it("works when moving a fixed distance and the point is about to go around a corner", () => {
		const world = new World(false);
		world.tiles.set(new Vector(0, 0), TowerTile.TOWER_TILE);
		world.tiles.set(new Vector(1, 0), TowerTile.TOWER_TILE);

		const point = new PointOnSurface(new Vector(0, 0), "left");
		const [distance, newPoint] = point.move(null, world, "clockwise", 10, false);
		assert.equal(distance, 10);
		assert.equal(newPoint.normal, "up");
		assert.deepEqual(newPoint.position, new Vector(10, 0));
	});
	it("stops at the end when moving a fixed distance and encountering a platform edge", () => {
		const world = new World(false);
		world.tiles.set(0, 0, Platform.PLATFORM);

		const point = new PointOnSurface(new Vector(35, 0), "up");
		const [distance, newPoint] = point.move(null, world, "clockwise", 55, false);

		assert.equal(newPoint.normal, "up");
		assert.deepEqual(newPoint.position, new Vector(50, 0));
	});
	it("works when stopping on a segment that ends with a platform edge", () => {
		const world = new World(false);
		world.tiles.set(0, 0, TowerTile.TOWER_TILE);
		world.tiles.set(1, 1, Platform.PLATFORM);

		const point = new PointOnSurface(new Vector(WorldData.TILE_SIZE, 35), "right");
		const [distance, newPoint] = point.move(null, world, "clockwise", 50, false);
		assert.equal(newPoint.normal, "up");
		assert.deepEqual(newPoint.position, new Vector(WorldData.TILE_SIZE + 35, WorldData.TILE_SIZE));
	});
	it("works when moving through a platform from below", () => {
		const world = new World(false);
		world.tiles.set(-1, 0, TowerTile.TOWER_TILE);
		world.tiles.set(0, 0, Platform.PLATFORM);

		const point = new PointOnSurface(new Vector(0, 10), "right");
		const [distance, newPoint] = point.move(null, world, "counterclockwise", 50, false);
		assert.equal(newPoint.normal, "up");
		assert.deepEqual(newPoint.position, new Vector(-40, 0));
	});
});
