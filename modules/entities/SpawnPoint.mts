import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Entity } from "../game-utilities/Entity.mjs";

export class SpawnPoint extends Entity {
	position: Vector;

	constructor(position: Vector) {
		super();
		this.position = position;
	}

	render() { return []; }
	display() {}
	update() {}

	boundingBox(): Rectangle {
		return Rectangle.square(this.position.x, this.position.y, 1);
	}
}
