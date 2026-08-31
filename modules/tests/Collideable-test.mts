import { assert } from "chai";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { TowerSlope } from "../tiles/TowerSlope.mjs";

class CollideableSpy extends RectangularCollideable {
	name: string;
	pushable: boolean;
	crushable: boolean;
	collisions: number = 0;
	destroyed: boolean = false;
	amountTranslated: Vector = new Vector(0, 0);

	constructor(hitbox: Rectangle, name: string, world: World, pushable: boolean, crushable: boolean = pushable) {
		super(hitbox, world);
		this.name = name;
		this.pushable = pushable;
		this.crushable = crushable;
	}

	render() { return []; }
	display() { }
	update() { }

	onCollision() {
		this.collisions ++;
	}

	canPush(obj: Collideable) {
		if(obj instanceof CollideableSpy) {
			return obj.pushable;
		}
		return false;
	}
	canCrush(obj: Collideable) {
		return obj instanceof CollideableSpy && obj.crushable;
	}

	destroy(): void {
		this.world.entities.delete(this);
		this.destroyed = true;
	}

	translate(amount: Vector): void {
		super.translate(amount);
		this.amountTranslated = this.amountTranslated.add(amount);
	}
}

describe("Collideable.moveUnit", () => {
	const createWorld = (tiles: TileWithPosition[] = []) => {
		const world = new World(false);
		world.entities.clear();
		for(const { tile, position } of tiles) {
			world.tiles.set(position, tile);
		}
		return world;
	};
	const addEntities = (entities: Collideable[], world: World) => {
		for(const entity of entities) {
			const added = world.addEntityIfEmpty(entity);
			if(!added) {
				throw new Error("Error in test setup: entities overlapped.");
			}
		}
	};

	it("moves the Collideable if there is no obstruction", () => {
		const world = new World(false);
		const collideable = new CollideableSpy(Rectangle.fromDimensions(0, 0, 10, 10), "collideable", world, true);
		addEntities([collideable], world);
		collideable.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(collideable.hitbox, Rectangle.fromDimensions(1, 0, 10, 10));
		assert.equal(collideable.collisions, 0);
	});
	it("pushes the next Collideable if there is a collision and it is pushable", () => {
		const world = new World(false);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(0, 0, 10, 10), "pusher", world, true);
		const pushed = new CollideableSpy(Rectangle.fromDimensions(10, 0, 10, 10), "pushed", world, true);
		addEntities([pusher, pushed], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.hitbox, Rectangle.fromDimensions(1, 0, 10, 10));
		assert.deepEqual(pushed.hitbox, Rectangle.fromDimensions(11, 0, 10, 10));
		assert.equal(pusher.collisions, 1);
		assert.equal(pushed.collisions, 1);
	});
	it("does not move if the next object is not pushable", () => {
		const world = new World(false);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(0, 0, 10, 10), "pusher", world, true);
		const pushed = new CollideableSpy(Rectangle.fromDimensions(10, 0, 10, 10), "pushed", world, false);
		addEntities([pusher, pushed], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.hitbox, Rectangle.fromDimensions(0, 0, 10, 10));
		assert.deepEqual(pushed.hitbox, Rectangle.fromDimensions(10, 0, 10, 10));
		assert.equal(pusher.collisions, 1);
		assert.equal(pushed.collisions, 1);
	});
	it("destroys the next object if the object after that one is unpushable", () => {
		const world = new World(false);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(0, 0, 10, 10), "pusher", world, true);
		const pushed = new CollideableSpy(Rectangle.fromDimensions(10, 0, 10, 10), "pushed", world, true);
		const unpushable = new CollideableSpy(Rectangle.fromDimensions(20, 0, 10, 10), "unpushable", world, false);
		addEntities([pusher, pushed, unpushable], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.hitbox, Rectangle.fromDimensions(1, 0, 10, 10));
		assert.deepEqual(unpushable.hitbox, Rectangle.fromDimensions(20, 0, 10, 10));

		assert.equal(pusher.collisions, 1);
		assert.equal(pushed.collisions, 2);
		assert.equal(unpushable.collisions, 1);

		assert.isFalse(pusher.destroyed);
		assert.isTrue(pushed.destroyed);
		assert.isFalse(unpushable.destroyed);
	});
	it("does not destroy the object or call any collision handler if the move is blocked simultaneously", () => {
		const world = new World(false);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(0, 0, 10, 20), "pusher", world, true);
		const pushable = new CollideableSpy(Rectangle.fromDimensions(10, 0, 10, 10), "pushable", world, true);
		const unpushable1 = new CollideableSpy(Rectangle.fromDimensions(10, 10, 10, 10), "unpushable1", world, false);
		const unpushable2 = new CollideableSpy(Rectangle.fromDimensions(20, 0, 10, 10), "unpushable2", world, false);
		addEntities([pusher, pushable, unpushable1, unpushable2], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.amountTranslated, new Vector(0, 0));
		assert.deepEqual(pushable.amountTranslated, new Vector(0, 0));
		assert.deepEqual(unpushable1.amountTranslated, new Vector(0, 0));
		assert.deepEqual(unpushable2.amountTranslated, new Vector(0, 0));

		assert.isFalse(pusher.destroyed);

		assert.equal(pusher.collisions, 1);
		assert.equal(pushable.collisions, 0);
		assert.equal(unpushable1.collisions, 1);
		assert.equal(unpushable2.collisions, 0);
	});
	it("moves everything the correct amount even when the collision graph is not a tree", () => {
		const world = new World(false);
		const first = new CollideableSpy(Rectangle.fromDimensions(0, 0, 10, 20), "first", world, true);
		const middle1 = new CollideableSpy(Rectangle.fromDimensions(10, 0, 10, 10), "middle1", world, true);
		const middle2 = new CollideableSpy(Rectangle.fromDimensions(10, 10, 10, 10), "middle2", world, true);
		const last = new CollideableSpy(Rectangle.fromDimensions(20, 0, 10, 10), "last", world, true);
		const uninvolved = new CollideableSpy(Rectangle.fromDimensions(40, 0, 10, 10), "uninvolved", world, true);
		addEntities([first, middle1, middle2, last, uninvolved], world);
		first.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(first.amountTranslated, new Vector(1, 0));
		assert.deepEqual(middle1.amountTranslated, new Vector(1, 0));
		assert.deepEqual(middle2.amountTranslated, new Vector(1, 0));
		assert.deepEqual(last.amountTranslated, new Vector(1, 0));
		assert.deepEqual(uninvolved.amountTranslated, new Vector(0, 0));
	});

	it("does not move when the pushed object is obstructed and pushable but not crushable", () => {
		const world = new World(false);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(0, 0, 10, 10), "pusher", world, true);
		const pushable = new CollideableSpy(Rectangle.fromDimensions(10, 0, 10, 10), "pushable", world, true, false);
		const unpushable = new CollideableSpy(Rectangle.fromDimensions(20, 0, 10, 10), "unpushable", world, false);
		addEntities([pusher, pushable, unpushable], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.amountTranslated, new Vector(0, 0));
		assert.deepEqual(pushable.amountTranslated, new Vector(0, 0));
		assert.deepEqual(unpushable.amountTranslated, new Vector(0, 0));
	});
	it("does not collide if the move is blocked simultaneously by a pushable-but-not-crushable object", () => {
		const world = new World(false);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(0, 0, 10, 20), "pusher", world, true);
		const pushable = new CollideableSpy(Rectangle.fromDimensions(10, 0, 10, 10), "pushable", world, true);
		const pushableButUncrushable = new CollideableSpy(Rectangle.fromDimensions(10, 10, 10, 10), "pushableButUncrushable", world, true, false);
		const unpushable = new CollideableSpy(Rectangle.fromDimensions(20, 10, 10, 10), "unpushable", world, false);
		addEntities([pusher, pushable, pushableButUncrushable, unpushable], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.amountTranslated, new Vector(0, 0));
		assert.deepEqual(pushable.amountTranslated, new Vector(0, 0));
		assert.deepEqual(pushableButUncrushable.amountTranslated, new Vector(0, 0));
		assert.deepEqual(unpushable.amountTranslated, new Vector(0, 0));

		assert.equal(pusher.collisions, 1);
		assert.equal(pushable.collisions, 0);
	});

	it("correctly moves Collideables down slopes of type up-right", () => {
		const world = createWorld([
			{ position: new Vector(0, 0), tile: TowerSlope.SLOPE_UP_RIGHT },
		]);
		const collideable = new CollideableSpy(Rectangle.fromDimensions(0, -10, 10, 10), "collideable", world, true);
		addEntities([collideable], world);
		collideable.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(collideable.amountTranslated, new Vector(1, 1));
	});
	it("correctly moves Collideables down slopes of type up-left", () => {
		const world = createWorld([
			{ position: new Vector(0, 0), tile: TowerSlope.SLOPE_UP_LEFT },
		]);
		const collideable = new CollideableSpy(Rectangle.fromDimensions(WorldData.TILE_SIZE - 10, -10, 10, 10), "collideable", world, true);
		addEntities([collideable], world);
		collideable.moveUnit("left", world, { movedObjects: new Set() });

		assert.deepEqual(collideable.amountTranslated, new Vector(-1, 1));
	});
	it("correctly moves Collideables up slopes of type up-right", () => {
		const world = createWorld([
			{ position: new Vector(0, 0), tile: TowerSlope.SLOPE_UP_RIGHT },
		]);
		const collideable = new CollideableSpy(Rectangle.fromDimensions(WorldData.TILE_SIZE, WorldData.TILE_SIZE - 10, 10, 10), "collideable", world, true);
		addEntities([collideable], world);
		collideable.moveUnit("left", world, { movedObjects: new Set() });

		assert.deepEqual(collideable.amountTranslated, new Vector(-1, -1));
	});
	it("correctly moves Collideables up slopes of type up-left", () => {
		const world = createWorld([
			{ position: new Vector(0, 0), tile: TowerSlope.SLOPE_UP_LEFT },
		]);
		const collideable = new CollideableSpy(Rectangle.fromDimensions(-10, WorldData.TILE_SIZE - 10, 10, 10), "collideable", world, true);
		addEntities([collideable], world);
		collideable.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(collideable.amountTranslated, new Vector(1, -1));
	});

	it("works when an object pushes another object up a slope", () => {
		const world = createWorld([
			{ position: new Vector(0, 0), tile: TowerSlope.SLOPE_UP_LEFT },
		]);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(-10, WorldData.TILE_SIZE - 20, 10, 20), "pusher", world, true);
		const pushed = new CollideableSpy(Rectangle.fromDimensions(0, WorldData.TILE_SIZE - 20, 10, 10), "pushed", world, true);
		addEntities([pusher, pushed], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.amountTranslated, new Vector(1, -1));
		assert.deepEqual(pushed.amountTranslated, new Vector(1, -1));
		assert.equal(pusher.collisions, 1);
		assert.equal(pushed.collisions, 1);
		assert.isFalse(pusher.destroyed);
		assert.isFalse(pushed.destroyed);
	});
	it("does not move the object when the object tries to move up a slope but is blocked from above, even by a pushable object", () => {
		const world = createWorld([
			{ position: new Vector(0, 0), tile: TowerSlope.SLOPE_UP_LEFT },
		]);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(-10, WorldData.TILE_SIZE - 10, 10, 10), "pusher", world, true);
		const pushable = new CollideableSpy(Rectangle.fromDimensions(-10, WorldData.TILE_SIZE - 20, 10, 10), "pushable", world, true);
		addEntities([pusher, pushable], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.amountTranslated, new Vector(0, 0));
		assert.deepEqual(pushable.amountTranslated, new Vector(0, 0));
		assert.isFalse(pusher.destroyed);
		assert.isFalse(pushable.destroyed);
	});
	it("works when an object pushes another object down a slope", () => {
		const world = createWorld([
			{ position: new Vector(0, 0), tile: TowerSlope.SLOPE_UP_RIGHT },
		]);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(0, -10, 10, 10), "pusher", world, true);
		const pushed = new CollideableSpy(Rectangle.fromDimensions(10, -10, 10, 20), "pushed", world, true);
		addEntities([pusher, pushed], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.amountTranslated, new Vector(1, 1));
		assert.deepEqual(pushed.amountTranslated, new Vector(1, 1));
	});
	it("moves horizontally when the object tries to move down a slope but is blocked from below, even by a pushable object", () => {
		const world = createWorld([
			{ position: new Vector(0, 0), tile: TowerSlope.SLOPE_UP_RIGHT },
		]);
		const pusher = new CollideableSpy(Rectangle.fromDimensions(0, -10, 20, 10), "pusher", world, true);
		const pushable = new CollideableSpy(Rectangle.fromDimensions(10, 0, 10, 10), "pushable", world, true);
		addEntities([pusher, pushable], world);
		pusher.moveUnit("right", world, { movedObjects: new Set() });

		assert.deepEqual(pusher.amountTranslated, new Vector(1, 0));
		assert.deepEqual(pushable.amountTranslated, new Vector(0, 0));
		assert.isFalse(pusher.destroyed);
		assert.isFalse(pushable.destroyed);
	});
});
