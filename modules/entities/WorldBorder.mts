import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { World } from "../world/World.mjs";

export class WorldBorder extends RectangularCollideable {
	damageable: boolean = false;

	constructor(hitbox: Rectangle, world: World) {
		super(hitbox, world);
	}

	render() { return []; }
	display() { }
	update() { }
}
