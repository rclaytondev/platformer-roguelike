import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { FireballData, SpiderData } from "../constants/GameData.mjs";
import { Explosion } from "../game-utilities/Explosion.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";

export class Fireball extends RectangularCollideable {
	velocity: Vector;
	acceleration: Vector;
	ignoredEntities: Collideable[];
	slideUpSlopes: boolean = false;
	slideDownSlopes: boolean = false;

	constructor(position: Vector, velocity: Vector, acceleration: Vector, ignoredEntities: Collideable[], world: World) {
		super(Rectangle.square(position.x, position.y, 1), world);
		this.velocity = velocity;
		this.acceleration = acceleration;
		this.ignoredEntities = ignoredEntities;
		this.world = world;
	}

	update(canvasIO: CanvasIO) {
		this.velocity = this.velocity.add(this.acceleration);
		this.move(this.velocity, this.world, canvasIO, {
			collides: (obj) => !(this.ignoredEntities as unknown[]).includes(obj),
		});

		this.world.particles.add(new Particle(
			this.hitbox.center(),
			new Vector(0, 0),
			SpiderData.PROJECTILE_PARTICLE_SETTINGS,
		), this.world);
	}

	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		GraphicsUtils.glowCircle(
			center.x, center.y,
			FireballData.GLOW_SIZE, FireballData.GLOW_INTENSITY,
			canvasIO,
			FireballData.GLOW_COLOR.red, FireballData.GLOW_COLOR.green, FireballData.GLOW_COLOR.blue,
		);
	}
	render() {
		return [
			new Renderable(c => this.displayGlowEffect(c), "glow"),
		];
	}


	onCollision(): void {
		this.explode();
	}
	explode() {
		this.world.entities.delete(this);

		const center = this.hitbox.center();
		new Explosion(center).explode(this.world);
	}
}
