import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { HealthPickupData, WorldData } from "../constants/GameData.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";

export class HealthPickup extends RectangularCollideable {
	constructor(tilePosition: Vector) {
		super(Rectangle.square(
			tilePosition.x * WorldData.TILE_SIZE,
			tilePosition.y * WorldData.TILE_SIZE,
			HealthPickupData.SIZE,
		));
	}

	display(canvasIO: CanvasIO) {
		const image = HealthPickupData.IMAGE;
		canvasIO.ctx.drawImage(image, this.hitbox.x, this.hitbox.y);
	}
	update(world: World) {
		const hitbox = Rectangle.fromBounds(
			this.hitbox.left - HealthPickupData.HITBOX_RADIUS,
			this.hitbox.right + HealthPickupData.HITBOX_RADIUS,
			this.hitbox.top - HealthPickupData.HITBOX_RADIUS,
			this.hitbox.bottom + HealthPickupData.HITBOX_RADIUS,
		);
		const player = world.player.hitbox;
		if(player.intersects(hitbox)) {
			world.player.health ++;
			world.entities.delete(this);
		}
	}
	render() {
		return [new Renderable(this.display.bind(this), "entity")];
	}
}
