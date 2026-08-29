import { CanvasIO } from "../../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { World } from "../../world/World.mjs";
import { Collideable, MoveOptions } from "./Collideable.mjs";

export abstract class RectangularCollideable extends Collideable {
	hitbox: Rectangle;

	constructor(hitbox: Rectangle, world: World) {
		super(world);

		this.hitbox = hitbox;
		if(Number.isFinite(hitbox.left)) {
			this.subpixel.x = hitbox.left - Math.floor(hitbox.left);
			hitbox.x = Math.floor(hitbox.x);
		}
		if(Number.isFinite(hitbox.top)) {
			this.subpixel.y = hitbox.top - Math.floor(hitbox.top);
			hitbox.y = Math.floor(hitbox.y);
		}
	}

	hitboxes() {
		return [this.hitbox];
	}
	boundingBox() {
		return this.hitbox;
	}
	translate(amount: Vector): void {
		this.hitbox.x += amount.x;
		this.hitbox.y += amount.y;
		this.world.entities.updatePosition(this);
	}

	extend(amount: number, direction: Direction, world: World, canvasIO: CanvasIO, options: MoveOptions & { queryOnly?: boolean }) {
		if(amount < 0) {
			this.hitbox = this.hitbox.extend(direction, Math.floor(amount));
		}
		for(let i = 0; i < amount; i ++) {
			const moved = this.moveUnit(direction, world, canvasIO, { ...options, movedObjects: new Set() });
			if(moved) {
				this.hitbox = this.hitbox.extend(Directions.opposite[direction], 1);
			}
		}
	}
}
