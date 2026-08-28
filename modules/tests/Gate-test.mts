import { assert } from "chai";
import { World } from "../world/World.mjs";
import { Gate, GateController } from "../entities/Gate.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { TowerTile } from "../tiles/TowerTile.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { canvasIO } from "../app-entry-points/CanvasIOInitializer.mjs";
import { Tiles } from "../world/Tiles.mjs";

const areGatesToggled = (world: World) => {
	const controller = world.staticEntities.entitiesList.find(e => e instanceof GateController);
	if(!controller) {
		throw new Error("Did not find a GateController in the provided World object.");
	}
	return controller.open;
};

export const createGateHallway = (gateWidth: number, gateHeight: 1 | 2) => {
	const world = new World(false);
	world.tiles.fillRect(Rectangle.fromDimensions(0, 0, gateWidth + 2, 1), TowerTile.TOWER_TILE);
	for(let x = 1; x <= gateWidth; x ++) {
		world.entities.add(Gate.atTile(new Vector(x, 1), "down", true, world));
		if(gateHeight === 2) {
			world.entities.add(Gate.atTile(new Vector(x, 2), "up", true, world));
		}
	}
	world.tiles.fillRect(Rectangle.fromDimensions(0, gateHeight + 1, gateWidth + 2, 1), TowerTile.TOWER_TILE);
	return world;
};

const movePlayerTo = (tileX: number, tileY: number, world: World) => {
	const tileCenter = Tiles.getTileSquare(new Vector(tileX, tileY)).center();
	world.player.hitbox = Rectangle.fromCenter(tileCenter.x, tileCenter.y, world.player.hitbox.width, world.player.hitbox.height);
};

const moveAndCheckGates = (tileX: number, tileY: number, expectedToggled: boolean, world: World) => {
	movePlayerTo(tileX, tileY, world);
	world.update(canvasIO!);
	assert.equal(areGatesToggled(world), expectedToggled);
};

describe("Gate toggle detection", () => {
	it("toggles when the player goes through", () => {
		const world = createGateHallway(1, 1);
		moveAndCheckGates(0, 1, false, world);
		moveAndCheckGates(6, 1, true, world);
	});
	it("does not toggle when the player goes partially through and back", () => {
		const world = createGateHallway(1, 1);
		moveAndCheckGates(0, 1, false, world);
		moveAndCheckGates(1.5, 1, false, world);
		moveAndCheckGates(0, 1, false, world);
	});
	it("does not toggle when the player goes past in a different row", () => {
		const world = createGateHallway(1, 1);
		moveAndCheckGates(0, -1, false, world);
		moveAndCheckGates(1, -1, false, world);
		moveAndCheckGates(2, -1, false, world);
	});
	it("toggles when the player goes through the middle of a 2-tall horizontal gate", () => {
		const world = createGateHallway(1, 2);
		moveAndCheckGates(0, 1.5, false, world);
		moveAndCheckGates(3, 1.5, true, world);
	});
	it("toggles when the player goes through several adjacent gates in a row", () => {
		const world = createGateHallway(3, 1);
		moveAndCheckGates(0, 1, false, world);
		moveAndCheckGates(1, 1, false, world);
		moveAndCheckGates(2, 1, false, world);
		moveAndCheckGates(3, 1, false, world);
		moveAndCheckGates(4, 1, true, world);
	});
	it("does not toggle when the player moves partially past a gate while in a different row, then continues in the gate's row", () => {
		const world = createGateHallway(1, 1);
		moveAndCheckGates(2.5, -1, false, world);
		moveAndCheckGates(2.5, 1, false, world);
		moveAndCheckGates(4, 1, false, world);
	});
	it("toggles when the player goes through a 2-tall horizontal gate and moves vertically while inside", () => {
		const world = createGateHallway(1, 2);
		moveAndCheckGates(0, 1, false, world);
		moveAndCheckGates(1, 1, false, world);
		moveAndCheckGates(1, 2, false, world);
		moveAndCheckGates(4, 2, true, world);
	});
});
