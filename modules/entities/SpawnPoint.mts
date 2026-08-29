import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { World } from "../world/World.mjs";

export class SpawnPoint extends Entity {
	position: Vector;

	constructor(position: Vector, world: World) {
		super(world);
		this.position = position;
	}

	render() { return []; }
	display() {}
	update(_canvasIO?: CanvasIO) {}

	boundingBox(): Rectangle {
		return Rectangle.square(this.position.x, this.position.y, 1);
	}
}
