import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { PlayerData, RoomData, TeleportingCreatureData, WorldData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { FireSpawner } from "../game-utilities/FireSpawner.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { Spawnable } from "../level-generator/Spawnable.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { World } from "../world/World.mjs";


class ReadyMode {
	update(self: TeleportingCreature) {
		if(self.seesPlayer() && self.isClosestToPlayer()) {
			const teleported = self.teleport();
			if(teleported) {
				self.mode = new PauseMode();
			}
		}
	}
}

class PauseMode {
	timeInMode: number = 0;
	update(self: TeleportingCreature) {
		this.timeInMode ++;
		if(this.timeInMode > TeleportingCreatureData.TELEGRAPH_DURATION) {
			self.fireSpawner.startFire(TeleportingCreatureData.FIRE_DURATION);
			self.mode = new FiringMode();
		}
	}
}

class FiringMode {
	update(self: TeleportingCreature) {
		if(self.fireSpawner.timeLeft < 0) {
			self.mode = new CooldownMode();
		}
	}
}

class CooldownMode {
	timeInMode: number = 0;
	update(self: TeleportingCreature) {
		this.timeInMode ++;
		if(this.timeInMode > TeleportingCreatureData.COOLDOWN_DURATION) {
			self.mode = new ReadyMode();
		}
	}
}

export class TeleportingCreature extends RectangularCollideable {
	velocity: Vector = new Vector(0, 0);

	mode: ReadyMode | PauseMode | CooldownMode = new ReadyMode();
	fireSpawner: FireSpawner = new FireSpawner(new Vector(0, 0), "up", TeleportingCreatureData.FIRE);

	private constructor(position: Vector, world: World) {
		super(Rectangle.fromDimensions(position.x, position.y, TeleportingCreatureData.HITBOX_WIDTH, TeleportingCreatureData.HITBOX_HEIGHT), world);
		this.world = world;
	}
	static atTile(tilePosition: Vector, world: World) {
		return new TeleportingCreature(
			tilePosition
			.add(0.5, 0.5)
			.multiply(WorldData.TILE_SIZE)
			.subtract(TeleportingCreatureData.HITBOX_WIDTH / 2, TeleportingCreatureData.HITBOX_HEIGHT / 2),
			world,
		);
	}
	static spawn(tilePosition: Vector, world: World) {
		return world.addEntityIfEmpty(TeleportingCreature.atTile(tilePosition, world));
	}

	render() {
		return this.renderWithGlow();
	}
	renderWithGlow() {
		return [
			new Renderable(c => this.display(c, true), "entity"),
			new Renderable(c => this.displayGlowEffect(c), "glow"),
			new Renderable(c => this.fireSpawner.displayHurtbox(c), "hitbox"),
		];
	}
	renderWithoutGlow() {
		return [
			new Renderable(c => this.display(c, false), "entity"),
		];
	}
	display(canvasIO: CanvasIO, glow: boolean) {
		canvasIO.ctx.save();
		canvasIO.ctx.translate(0, TeleportingCreatureData.GRAPHICS.BODY_OFFSET_Y);
		this.displayBody(canvasIO);
		this.displayEye(canvasIO, glow);
		this.displayLegs(canvasIO);
		canvasIO.ctx.restore();
	}
	displayBody(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.fillStyle = TeleportingCreatureData.GRAPHICS.COLOR;
		canvasIO.fillRegularPoly(center, TeleportingCreatureData.GRAPHICS.BODY_SIZE, 3, -Math.PI / 6);
	}
	displayEye(canvasIO: CanvasIO, glow: boolean) {
		const center = this.hitbox.center();
		const eyeColor = `rgb(${TeleportingCreatureData.GRAPHICS.EYE_COLOR.red}, ${TeleportingCreatureData.GRAPHICS.EYE_COLOR.green}, ${TeleportingCreatureData.GRAPHICS.EYE_COLOR.blue})`; // TODO: refactor (extract Color class)
		canvasIO.ctx.fillStyle = glow ? eyeColor : TeleportingCreatureData.GRAPHICS.UNLIT_EYE_COLOR;
		canvasIO.fillDiamond(center.x, center.y, TeleportingCreatureData.GRAPHICS.EYE_SIZE);
	}
	displayLegs(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.strokeStyle = TeleportingCreatureData.GRAPHICS.COLOR;
		canvasIO.ctx.lineWidth = TeleportingCreatureData.GRAPHICS.LEG_WIDTH;
		for(const sign of [1, -1]) {
			canvasIO.strokeLine(
				center.x + sign * TeleportingCreatureData.GRAPHICS.LEG_ENDPOINT_1.x,
				center.y + TeleportingCreatureData.GRAPHICS.LEG_ENDPOINT_1.y,
				center.x + sign * TeleportingCreatureData.GRAPHICS.LEG_ENDPOINT_2.x,
				center.y + TeleportingCreatureData.GRAPHICS.LEG_ENDPOINT_2.y,
			);
		}
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		GraphicsUtils.glowCircle(
			center.x, center.y,
			TeleportingCreatureData.GRAPHICS.GLOW_SIZE, TeleportingCreatureData.GRAPHICS.GLOW_INTENSITY,
			canvasIO,
			TeleportingCreatureData.GRAPHICS.EYE_COLOR.red, TeleportingCreatureData.GRAPHICS.EYE_COLOR.green, TeleportingCreatureData.GRAPHICS.EYE_COLOR.blue,
		);
	}

	update() {
		this.mode.update(this);
		this.fireSpawner.position = this.hitbox.center();
		this.fireSpawner.update(this.world);
		this.fireSpawner.updateHurtbox(this.world);
		this.move(this.velocity, this.world, {});
		this.velocity.y += PlayerData.GRAVITY;
	}
	hasLineOfSight() {
		return this.world.hasLineOfSight(this.hitbox.center(), this.world.player.hitbox, (e) => e !== this);
	}
	isInRangeOfPlayer() {
		const playerCenter = this.world.player.hitbox.center();
		return Vector.dist(this.hitbox.center(), playerCenter) < TeleportingCreatureData.MAX_TELEPORT_RANGE;
	}
	seesPlayer() {
		return this.isInRangeOfPlayer() && this.hasLineOfSight();
	}
	isClosestToPlayer() {
		const player = this.world.player.hitbox.center();
		const distance = Vector.dist(this.hitbox.center(), player);
		const region = Rectangle.fromCenter(player.x, player.y, TeleportingCreatureData.MAX_TELEPORT_RANGE, TeleportingCreatureData.MAX_TELEPORT_RANGE);
		const others = [...this.world.entities.collideablesIntersecting(region)].filter(
			c => c instanceof TeleportingCreature && c !== this && c.mode instanceof ReadyMode && c.seesPlayer(),
		) as TeleportingCreature[];
		const distances = others.map(c => Vector.dist(c.hitbox.center(), player));
		return distances.every(d => d >= distance);
	}
	getTeleportDestination() {
		const playerTile = Tiles.getTileCoordinates(this.world.player.hitbox.center());
		for(let yDistance = 0; yDistance < TeleportingCreatureData.MAX_TELEPORT_DISTANCE_Y; yDistance ++) {
			const targetTile = playerTile.add(0, yDistance);
			const targetTileCenter = Tiles.getTileSquare(targetTile).center();
			const targetHitbox = Rectangle.fromCenter(targetTileCenter.x, targetTileCenter.y, TeleportingCreatureData.HITBOX_WIDTH, TeleportingCreatureData.HITBOX_HEIGHT);
			const searchRegion = Rectangle.fromDimensions(targetHitbox.x, targetHitbox.bottom, targetHitbox.width, TeleportingCreatureData.TELEPORT_LOOKBELOW_DISTANCE);
			const collideables = this.world.entities.collideablesIntersecting(searchRegion);
			if(!this.world.isInSolid(targetHitbox, e => e !== this) && ![...collideables].some(c => c instanceof TeleportingCreature && c !== this)) {
				return targetHitbox.getCorner("top-left");
			}
		}
		return null;
	}
	teleport() {
		const destination = this.getTeleportDestination();
		if(destination) {
			const initialPosition = this.hitbox.center();
			this.hitbox.x = destination.x;
			this.hitbox.y = destination.y;
			this.world.entities.updatePosition(this);

			const newPosition = this.hitbox.center();
			this.world.entities.add(new TeleportParticle(initialPosition, newPosition, this.world));

			return true;
		}
		return false;
	}

	onCollision(collision: CollisionEvent): void {
		if(collision.directionOf(this) === "down") {
			this.velocity.y = 0;
		}
	}

	translate(amount: Vector): void {
		super.translate(amount);
		this.fireSpawner.translate(amount);
	}
}

class TeleportParticle extends Entity {
	endpoint1: Vector;
	endpoint2: Vector;
	lineWidth: number;

	constructor(endpoint1: Vector, endpoint2: Vector, world: World) {
		super(world);
		this.world = world;
		this.endpoint1 = endpoint1;
		this.endpoint2 = endpoint2;
		this.lineWidth = TeleportingCreatureData.ZAP_WIDTH;
	}

	update() {
		this.lineWidth -= TeleportingCreatureData.ZAP_WIDTH_DECAY;
		if(this.lineWidth <= 0) {
			this.world.entities.delete(this);
		}
	}
	render() {
		return [
			new Renderable(c => this.display(c), "telegraph"),
		];
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.strokeStyle = TeleportingCreatureData.ZAP_COLOR;
		canvasIO.ctx.lineWidth = this.lineWidth;
		canvasIO.strokeLine(this.endpoint1.x, this.endpoint1.y, this.endpoint2.x, this.endpoint2.y);
	}

	boundingBox(): Rectangle {
		return Rectangle.boundingBox([this.endpoint1, this.endpoint2]);
	}
}

LoadingManager.onload(() => {
	EntitySpawner.register(new Spawnable(
		"teleporting-creatures",
		true,
		(tileRegion: Rectangle, safeRegion: Rectangle, world: World) => {
			EntitySpawner.spawnEntities(
				tileRegion.area() / (RoomData.SIZE ** 2) * TeleportingCreatureData.CREATURES_PER_ROOM,
				TeleportingCreatureData.SPAWN_EVENNESS,
				tileRegion,
				[
					EntitySpawner.spawnRequirements.replaceEmpty,
					EntitySpawner.spawnRequirements.solidBelow,
				],
				TeleportingCreature.spawn,
				safeRegion,
				world,
			);
		},
	));
});
