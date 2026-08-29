import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { TileWithPosition, World } from "../../world/World.mjs";
import { Collideable } from "./Collideable.mjs";
import { RectangularCollideable } from "./RectangularCollideable.mjs";

export class InvisibleRectangle extends RectangularCollideable {
	constructor(hitbox: Rectangle, world: World) {
		super(hitbox, world);
	}

	render() { return []; }
	display() {}
	update() {}

	canPush(entity: Collideable | TileWithPosition): entity is Collideable {
		return entity instanceof Collideable;
	}
}
