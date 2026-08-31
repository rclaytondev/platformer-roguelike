import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { World } from "../../world/World.mjs";
import { RectangularCollideable } from "./RectangularCollideable.mjs";

export class InvisibleRectangle extends RectangularCollideable {
	constructor(hitbox: Rectangle, world: World) {
		super(hitbox, world);
	}

	render() { return []; }
	display() {}
	update() {}

	canPush() {
		return true;
	}
}
