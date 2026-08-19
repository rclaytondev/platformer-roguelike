import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { LaserBlockData, RoomData, WorldData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { World } from "../world/World.mjs";
import { Spawnable } from "../level-generator/Spawnable.mjs";

export class LaserBlock extends RectangularCollideable {
	lasers: number;
	speed: number;
	startAngle: number;
	lengths: number[];
	direction: 1 | -1;

	mode: "unactivated" | "waiting" | "activated" = "unactivated";
	modeStartTime: number = 0;

	angle(frameCount: number) {
		return this.startAngle + frameCount * this.speed;
	}

	private constructor(position: Vector, lasers: number, speed: number, startAngle: number, direction: 1 | -1) {
		super(Rectangle.square(position.x, position.y, WorldData.TILE_SIZE));
		this.lasers = lasers;
		this.speed = speed;
		this.startAngle = startAngle;
		this.lengths = new Array(lasers).fill(0);
		this.direction = direction;
	}
	static generate(tilePosition: Vector) {
		const direction = (Math.random() < 0.5) ? 1 : -1;
		return new LaserBlock(
			tilePosition.multiply(WorldData.TILE_SIZE),
			LaserBlockData.BEAMS_PER_BLOCK,
			LaserBlockData.SPEED * direction,
			RandomUtils.random(0, 2 * Math.PI),
			direction,
		);
	}

	render(world: World) {
		return [
			new Renderable((canvasIO: CanvasIO) => this.display(canvasIO, world.frameCount), "tile-entity"),
			new Renderable((canvasIO: CanvasIO) => this.displayGlowEffect(world.frameCount, canvasIO), "glow"),
		];
	}
	display(canvasIO: CanvasIO, frameCount: number) {
		canvasIO.ctx.fillStyle = LaserBlockData.TILE_COLOR;
		canvasIO.fillRect(this.hitbox);
		this.displayLasers(canvasIO, frameCount);
	}
	displayLasers(canvasIO: CanvasIO, frameCount: number) {
		canvasIO.ctx.lineWidth = (this.mode === "activated") ? LaserBlockData.ACTIVATED_THICKNESS : LaserBlockData.LASER_THICKNESS;
		const center = this.hitbox.center();
		for(const [i, angle] of this.angles(frameCount).entries()) {
			const distance = this.lengths[i];
			canvasIO.ctx.strokeStyle = GraphicsUtils.formatColor(this.color());
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.ctx.rotate(angle);
			canvasIO.linePointedness = canvasIO.ctx.lineWidth / 2;
			canvasIO.pointedLine(0, 0, distance, 0);
			canvasIO.ctx.restore();
		}
	}
	color() {
		return this.mode === "activated" ? LaserBlockData.ACTIVATED_COLOR : LaserBlockData.LASER_COLOR;
	}
	displayGlowEffect(frameCount: number, canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		for(const [i, angle] of this.angles(frameCount).entries()) {
			const distance = this.lengths[i];
			const endpoint = center.add(new Vector(distance, 0).rotate(MathUtils.toDegrees(angle)));
			const color = this.color();
			GraphicsUtils.glowOutline(
				center.x, center.y, endpoint.x, endpoint.y,
				LaserBlockData.LASER_GLOW_SIZE, LaserBlockData.LASER_GLOW_INTENSITY,
				canvasIO,
				color.red, color.green, color.blue,
			);
		}
	}
	displayBarrels(frameCount: number, canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.strokeStyle = LaserBlockData.BARREL_COLOR;
		canvasIO.ctx.lineWidth = LaserBlockData.BARREL_THICKNESS;
		for(const direction of this.directions(frameCount)) {
			canvasIO.strokeLine(
				center.x, center.y,
				center.x + direction.x * LaserBlockData.BARREL_LENGTH,
				center.y + direction.y * LaserBlockData.BARREL_LENGTH,
			);
		}
	}

	update(world: World) {
		this.updateLengths(world);
		this.updateMode(world.frameCount);
	}
	updateLengths(world: World) {
		const player = world.player.hitbox;
		for(const [i, direction] of this.directions(world.frameCount).entries()) {
			const length = this.endpointDistance(direction, world);
			this.lengths[i] = GeomUtils.moveTowards(this.lengths[i], length, LaserBlockData.LASER_LINEAR_SPEED);
			this.lengths[i] = Math.min(this.lengths[i], length);
			if(this.intersectsBox(direction, player, length)) {
				if(this.mode === "unactivated") {
					this.modeStartTime = world.frameCount;
					this.mode = "waiting";
					this.setSpeed(0, world.frameCount);
				}
				if(this.mode === "activated") {
					world.player.damage(world.player.hitbox, world);
				}
			}
		}
	}
	setSpeed(speed: number, frameCount: number) {
		const angle = this.angle(frameCount);
		this.startAngle = angle - frameCount * speed;
		this.speed = speed;
	}
	updateMode(frameCount: number) {
		if(this.mode === "waiting" && frameCount - this.modeStartTime > LaserBlockData.WAIT_TIMER) {
			this.mode = "activated";
			this.modeStartTime = frameCount;
			this.setSpeed(LaserBlockData.ACTIVATED_SPEED * this.direction, frameCount);
		}
		if(this.mode === "activated" && frameCount - this.modeStartTime > LaserBlockData.ACTIVATION_TIME) {
			this.mode = "unactivated";
			this.modeStartTime = frameCount;
			this.setSpeed(LaserBlockData.SPEED * this.direction, frameCount);
		}
	}

	angles(frameCount: number) {
		const angles = [];
		for(let i = 0; i < this.lasers; i ++) {
			angles.push(this.angle(frameCount) + i * 2 * Math.PI / this.lasers);
		}
		return angles;
	}
	directions(frameCount: number) {
		return this.angles(frameCount).map(a => new Vector(Math.cos(a), Math.sin(a)));
	}
	intersectsBox(direction: Vector, box: Rectangle, length: number) {
		const onscreenPosition = this.hitbox.center();
		return GeomUtils.rayIntersectsRectangle(
			onscreenPosition, direction,
			box,
		) <= length;
	}
	endpointDistance(direction: Vector, world: World) {
		const center = this.hitbox.center();
		return world.lineIntersectionDistance(center, direction, LaserBlockData.MAX_LENGTH, [], (e) => e !== this);
	}
	endpoint(direction: Vector, world: World) {
		const distance = this.endpointDistance(direction, world);
		return this.hitbox.center().add(direction.multiply(distance));
	}

	tilePosition() {
		return Tiles.getTileCoordinates(this.hitbox.center());
	}
}

LoadingManager.onload(() => {
	EntitySpawner.register(new Spawnable(
		"lasers",
		true,
		(tileRegion: Rectangle, safeRegion: Rectangle, world: World) => EntitySpawner.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * LaserBlockData.LASERS_PER_ROOM,
			LaserBlockData.SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceSolid,
				EntitySpawner.spawnRequirements.atLeast2Empty,
				EntitySpawner.spawnRequirements.noAdjacentGates,
				EntitySpawner.spawnRequirements.notOnFloor,
			],
			(position, world) => {
				world.removeTile(position);
				world.entities.add(LaserBlock.generate(position));
				return true;
			},
			safeRegion,
			world,
		),
	));
});
