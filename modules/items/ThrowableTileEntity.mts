import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ItemData, PlayerData, WorldData } from "../constants/GameData.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Player } from "../Player.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";
import { ThrowableTile } from "./ThrowableTile.mjs";
import { TileModifier } from "./TileModifier.mjs";

export class ThrowableTileEntity extends RectangularCollideable {
	modifiers: TileModifier[] = [];

	velocity: Vector = new Vector(0, 0);
	gravity: number = PlayerData.GRAVITY;
	frictionX: number = ItemData.FRICTION_X;
	frictionY: number = 1;
	groundedFrictionX: number = ItemData.GROUNDED_FRICTION_X;

	constructor(position: Vector = new Vector(0, 0), modifiers: TileModifier[], world: World) {
		super(Rectangle.square(position.x, position.y, WorldData.TILE_SIZE), world);
		this.gravity = ThrowableTileEntity.getGravity(modifiers);
		this.modifiers = modifiers;
		this.frictionY = Math.min(1, ...modifiers.map(m => m.frictionY ?? Infinity));
	}
	static getGravity(modifiers: TileModifier[]) {
		const values = new Set(modifiers.map(m => m.gravity));
		if(values.has("reverse")) {return -PlayerData.GRAVITY; }
		else if(values.has("none")) { return 0; }
		else { return PlayerData.GRAVITY; }
	}

	getItem() {
		return new ThrowableTile(this.modifiers);
	}

	update(canvasIO: CanvasIO) {
		if(this.velocity.x !== 0) {
			this.velocity.x *= this.isGrounded() ? this.groundedFrictionX : this.frictionX;
		}
		this.velocity.y *= this.frictionY;
		this.velocity.y += this.gravity;
		this.move(this.velocity, this.world, canvasIO, {
			collides: (obj) => obj !== this,
		});

		for(const modifier of this.modifiers) {
			modifier.update(this, this.world, canvasIO);
		}
	}
	isGrounded() {
		return this.collidingObjects("down", () => true).length !== 0;
	}

	render() {
		return [new Renderable(this.display.bind(this), "tile-entity")];
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = ItemData.BLOCK.COLOR;
		canvasIO.fillRect(this.hitbox);

		canvasIO.ctx.strokeStyle = WorldData.TILE_ACCENT_COLOR;
		canvasIO.ctx.lineWidth = WorldData.TILE_ACCENT_THICKNESS;
		canvasIO.strokeSquare(
			this.hitbox.x + WorldData.TILE_ACCENT_INSET,
			this.hitbox.y + WorldData.TILE_ACCENT_INSET,
			2 * WorldData.TILE_ACCENT_RADIUS,
		);

		const center = this.hitbox.center();
		canvasIO.strokeCircle(center.x, center.y, WorldData.TILE_ACCENT_RADIUS - (WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_RADIUS));
	}

	onCollision(collision: CollisionEvent): void {
		if(collision.movingObject === this) {
			if(Directions.isVertical(collision.direction)) {
				this.velocity.y = 0;
			}
			else {
				this.velocity.x = 0;
			}
		}
		for(const modifier of this.modifiers) {
			modifier.onCollision(this, collision);
		}
	}

	reset() {
		for(const modifier of this.modifiers) {
			modifier.reset();
		}
	}

	canPush(obj: Collideable): obj is Collideable {
		return obj instanceof Player;
	}
}
