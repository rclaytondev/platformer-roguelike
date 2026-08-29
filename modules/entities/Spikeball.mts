import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { SpikeballData, WorldData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { SpikeballBlock } from "./SpikeballBlock.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Player } from "../Player.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";

abstract class SpikeballState {
	abstract update(self: Spikeball, canvasIO: CanvasIO): void;

	abstract render(self: Spikeball): Renderable[];
}

class MovingState extends SpikeballState {
	update(self: Spikeball, canvasIO: CanvasIO): void {
		self.moveForward(canvasIO);
	}

	render() {
		return [];
	}
}

class AttackState extends SpikeballState {
	timeInState: number = 0;

	update(self: Spikeball): void {
		this.timeInState ++;

		if(this.timeInState > SpikeballData.TELEGRAPH_DELAY) {
			this.attack(self);
			if(this.timeInState > SpikeballData.TELEGRAPH_DELAY + SpikeballData.ATTACK_DURATION) {
				self.state = new MovingState();
			}
		}
	}
	attack(self: Spikeball) {
		const center = self.hitbox.center();
		const hurtbox = Rectangle.fromCenter(center.x, center.y, SpikeballData.HURTBOX_SIZE, SpikeballData.HURTBOX_SIZE);
		if(self.world.player.hitbox.intersects(hurtbox)) {
			self.world.player.damage();
		}
	}


	render(self: Spikeball) {
		return [new Renderable(c => this.display(self, c), "glow")];
	}
	display(self: Spikeball, canvasIO: CanvasIO) {
		if(this.timeInState > SpikeballData.TELEGRAPH_DELAY) {
			this.displayLightning(self, canvasIO);
		}
		else {
			this.displayTelegraph(self, canvasIO);
		}
	}
	displayLightning(self: Spikeball, canvasIO: CanvasIO) {
		const center = self.hitbox.center();
		canvasIO.ctx.strokeStyle = SpikeballData.ELECTRICITY_COLOR;
		canvasIO.ctx.lineWidth = SpikeballData.ELECTRICITY_WIDTH;
		for(let i = 0; i < SpikeballData.NUM_ELECTRIC_ARCS; i ++) {
			const endpoints = RandomUtils.randomEvenlySpaced({
				generate: () => RandomUtils.randomInCircle(center.x, center.y, SpikeballData.TELEGRAPH_RADIUS),
				metric: Vector.dist,
				amount: SpikeballData.ELECTRICITY_SEGMENTS,
				trials: SpikeballData.ELECTRICITY_EVENNESS,
			});
			for(let i = 0; i < endpoints.length - 1; i ++) {
				const [point, next] = [endpoints[i], endpoints[i+1]];
				canvasIO.strokeLine(point.x, point.y, next.x, next.y);
			}
		}
	}
	displayTelegraph(self: Spikeball, canvasIO: CanvasIO) {
		const center = self.hitbox.center();
		const thickness = GeomUtils.lerp(this.timeInState, 0, SpikeballData.TELEGRAPH_DELAY, SpikeballData.TELEGRAPH_THICKNESS, 1);
		GraphicsUtils.glowCircleOutline(center.x, center.y, SpikeballData.TELEGRAPH_RADIUS, thickness, 1, canvasIO, 255, 255, 0);
	}
}

export class Spikeball extends RectangularCollideable {
	state: SpikeballState = new MovingState();
	direction: Diagonal;
	age: number = 0;
	bounces: number = SpikeballData.BOUNCES;
	overlappingObjects: (Spikeball | SpikeballBlock | Vector)[] = [];
	lastCollisionFrame: number = -1;

	slideUpSlopes: boolean = false;
	slideDownSlopes: boolean = false;

	constructor(position: Vector, direction: Diagonal, world: World) {
		super(Rectangle.fromDimensions(position.x, position.y, 2 * SpikeballData.RADIUS, 2 * SpikeballData.RADIUS), world);
		this.direction = direction;
		this.world = world;
	}
	static fromCenter(position: Vector, direction: Diagonal, world: World) {
		return new Spikeball(
			position.subtract(SpikeballData.RADIUS, SpikeballData.RADIUS),
			direction,
			world,
		);
	}

	collides(object: Collideable | TileWithPosition) {
		if(object instanceof Spikeball || object instanceof SpikeballBlock) {
			return !this.overlappingObjects.includes(object);
		}
		else if(!(object instanceof Collideable)) {
			return !this.overlappingObjects.some(o => o instanceof Vector && o.equals(object.position));
		}
		return true;
	}

	render() {
		return [
			new Renderable(this.display.bind(this), "entity"),
			new Renderable(this.displayGlowEffect.bind(this), "glow"),
			...this.state.render(this),
		];
	}
	display(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.save();
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.ctx.rotate(-Directions.angle[this.direction]);
		canvasIO.ctx.fillStyle = SpikeballData.COLOR;
		canvasIO.fillPoly(
			-SpikeballData.WING_WIDTH, SpikeballData.WING_WIDTH,
			-SpikeballData.INNER_LENGTH, 0,
			-SpikeballData.WING_WIDTH, -SpikeballData.WING_WIDTH,
			SpikeballData.SPIKE_LENGTH, 0,
		);
		canvasIO.ctx.fillStyle = "yellow";
		canvasIO.ctx.scale(0.25, 0.25);
		canvasIO.fillPoly(
			-SpikeballData.WING_WIDTH, SpikeballData.WING_WIDTH,
			-SpikeballData.INNER_LENGTH, 0,
			-SpikeballData.WING_WIDTH, -SpikeballData.WING_WIDTH,
			SpikeballData.SPIKE_LENGTH, 0,
		);
		canvasIO.ctx.restore();
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.save();
		canvasIO.ctx.globalAlpha = this.age / SpikeballData.GLOW_FADE_TIME;
		GraphicsUtils.glowCircle(
			center.x, center.y,
			SpikeballData.GLOW_SIZE, SpikeballData.GLOW_INTENSITY,
			canvasIO,
			SpikeballData.ACCENT_COLOR.red, SpikeballData.ACCENT_COLOR.green, SpikeballData.ACCENT_COLOR.blue,
		);
		canvasIO.ctx.restore();
	}

	onCollision(collision: CollisionEvent) {
		if(this.lastCollisionFrame === this.world.frameCount) {
			return;
		}
		this.lastCollisionFrame = this.world.frameCount;
		const collidingObject = collision.collidingObject(this);
		if(collision.movingObject === this && !(collidingObject instanceof Player)) {
			this.bounces --;
			if(collidingObject instanceof Spikeball) {
				this.bounceOffSpikeball(collidingObject, collision.direction);
			}
			else {
				this.bounce(collision.direction);
			}
		}
		if(collidingObject instanceof Player && this.state instanceof MovingState) {
			this.state = new AttackState();
		}
	}
	bounceOffSpikeball(spikeball: Spikeball, movementDir: Direction) {
		const cornerDist = (
			(this.direction === "down-left" || this.direction === "up-right")
			? MathUtils.dist(this.hitbox.left + this.hitbox.top, spikeball.hitbox.left + spikeball.hitbox.top)
			: MathUtils.dist(this.hitbox.left - this.hitbox.top, spikeball.hitbox.left - spikeball.hitbox.top)
		);
		const isPerfectHit = (
			spikeball.direction === Directions.opposite[this.direction]
			&& cornerDist < SpikeballData.CORNER_BOUNCE_DIST
		);
		if(isPerfectHit) {
			this.direction = Directions.opposite[this.direction];
			spikeball.direction = Directions.opposite[spikeball.direction];
		}
		else {
			this.bounce(movementDir);
		}
	}
	bounce(movementDir: Direction) {
		if(Directions.isHorizontal(movementDir)) {
			this.direction = Directions.reflectX[this.direction];
		}
		else {
			this.direction = Directions.reflectY[this.direction];
		}
	}
	update(canvasIO: CanvasIO) {
		this.state.update(this, canvasIO);
		if(this.bounces < 0) {
			this.world.entities.delete(this);
			this.die(canvasIO);
		}
		this.age ++;
		if(this.age > (WorldData.TILE_SIZE - 2 * SpikeballData.RADIUS) / SpikeballData.SPEED) {
			this.overlappingObjects = this.overlappingObjects.filter(s => (
				((s instanceof Spikeball || s instanceof SpikeballBlock) && s.intersects(this))
				|| (s instanceof Vector && this.hitbox.intersects(Rectangle.square(s.x, s.y, 1).scale(WorldData.TILE_SIZE)))
			));
		}
	}
	moveForward(canvasIO: CanvasIO) {
		const options = {
			collides: this.collides.bind(this),
			movedObjects: new Set<Collideable>(),
		};
		for(let i = 0; i < SpikeballData.SPEED; i ++) {
			const direction = this.direction;
			const hitbox = Rectangle.fromBounds(this.hitbox.left, this.hitbox.right, this.hitbox.top, this.hitbox.bottom);
			const xDirection = (this.direction === "up-left" || this.direction === "down-left") ? "left" : "right";
			const yDirection = (this.direction === "up-left" || this.direction === "up-right") ? "up" : "down";
			const canMoveX = this.canMove(xDirection, this.world, canvasIO);
			const canMoveY = this.canMove(yDirection, this.world, canvasIO);
			this.move(Vector.gridUnit(this.direction), this.world, canvasIO, options);
			if(canMoveX === canMoveY && this.direction !== direction) {
				/* Hit a corner perfectly or hit a slope */
				this.direction = Directions.opposite[direction];
				this.hitbox = hitbox;
			}
		}
	}

	die(canvasIO: CanvasIO) {
		GraphicsUtils.shatterParticles(
			(canvasIO: CanvasIO) => this.display(canvasIO),
			this.world,
			this.hitbox.center(),
			SpikeballData.SHATTER_PIECES,
			SpikeballData.SHATTER_PARTICLE_SPEED,
			canvasIO,
			SpikeballData.SHATTER_ANGLE_EVENNESS,
			SpikeballData.SHATTER_PARTICLE_SETTINGS,
		);
	}
}
