import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { RoomData, SpikeballBlockData, SpikeballData, SpikeballPattern, WorldData } from "../constants/GameData.mjs";
import { Spikeball } from "./Spikeball.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { World } from "../world/World.mjs";
import { Diagonal } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Player } from "../Player.mjs";
import { ThrowableTileEntity } from "../items/ThrowableTileEntity.mjs";
import { Spawnable } from "../level-generator/Spawnable.mjs";

export class SpikeballBlock extends RectangularCollideable {
	timeUntilSpawn: number = 0;
	timeSinceSpawn: number = 0;
	pattern: SpikeballPattern;
	patternStep: number = 0;
	spikeballs: Spikeball[] = [];
	doors: { [diagonal in Diagonal]: number } = {
		"up-left": 0,
		"up-right": 0,
		"down-left": 0,
		"down-right": 0,
	};

	constructor(position: Vector, pattern: SpikeballPattern = SpikeballBlockData.PATTERNS[0]) {
		super(Rectangle.square(position.x, position.y, WorldData.TILE_SIZE));
		this.pattern = pattern;
	}
	static atTile(tilePosition: Vector, pattern: SpikeballPattern = SpikeballBlockData.PATTERNS[0]) {
		return new SpikeballBlock(tilePosition.multiply(WorldData.TILE_SIZE), pattern);
	}


	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		GraphicsUtils.glowCircle(
			center.x, center.y, SpikeballBlockData.GLOW_SIZE,
			SpikeballBlockData.GLOW_INTENSITY,
			canvasIO,
			SpikeballData.ACCENT_COLOR.red, SpikeballData.ACCENT_COLOR.green, SpikeballData.ACCENT_COLOR.blue,
		);
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = SpikeballBlockData.TILE_COLOR;
		canvasIO.fillRect(this.hitbox);

		const center = this.hitbox.center();

		for(const direction of Directions.DIAGONALS) {
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.rotateTo("up", direction);



			const openness = this.doors[direction];
			canvasIO.ctx.strokeStyle = `rgb(${SpikeballData.ACCENT_COLOR.red}, ${SpikeballData.ACCENT_COLOR.green}, ${SpikeballData.ACCENT_COLOR.blue})`;
			canvasIO.ctx.lineWidth = SpikeballBlockData.ACCENT_WIDTH;
			canvasIO.ctx.fillStyle = `rgb(${SpikeballData.ACCENT_COLOR.red}, ${SpikeballData.ACCENT_COLOR.green}, ${SpikeballData.ACCENT_COLOR.blue})`;
			canvasIO.strokeLine(0, 0, 0, -WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT);
			canvasIO.ctx.fillRect(-5, -5, 10, 10);


			canvasIO.ctx.fillStyle = SpikeballBlockData.DOOR_COLOR;
			canvasIO.ctx.fillRect(
				-WorldData.TILE_SIZE / 2, -WorldData.TILE_SIZE / 2,
				WorldData.TILE_SIZE / 2 - openness, SpikeballBlockData.DOOR_HEIGHT,
			);
			canvasIO.ctx.fillRect(
				openness, -WorldData.TILE_SIZE / 2,
				WorldData.TILE_SIZE / 2 - openness, SpikeballBlockData.DOOR_HEIGHT,
			);
			canvasIO.ctx.restore();
			// debugger;
		}
		for(const direction of Directions.DIAGONALS) {
			const openness = this.doors[direction];
			canvasIO.ctx.save();
			canvasIO.ctx.translate(center.x, center.y);
			canvasIO.rotateTo("up", direction);
			canvasIO.ctx.strokeStyle = GraphicsUtils.formatColor(SpikeballData.ACCENT_COLOR);
			canvasIO.ctx.lineWidth = SpikeballBlockData.ACCENT_WIDTH;
			canvasIO.ctx.lineCap = "round";
			for(const sign of [1, -1]) {
				canvasIO.strokeLine(
					sign * (-WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT / 2),
					-WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT / 2,
					sign * Math.max(-openness - SpikeballBlockData.DOOR_HEIGHT / 2, -WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT / 2),
					-WorldData.TILE_SIZE / 2 + SpikeballBlockData.DOOR_HEIGHT / 2,
				);
			}
			canvasIO.ctx.restore();
		}
	}
	render() {
		return [
			new Renderable(this.display.bind(this), "tile-entity"),
			new Renderable(this.displayGlowEffect.bind(this), "glow"),
		];
	}

	update(world: World, canvasIO: CanvasIO) {
		this.updateSpikeballs(world);
		this.updateDoors(world, canvasIO);
	}
	updateSpikeballs(world: World) {
		this.spikeballs = this.spikeballs.filter(
			s => world.entities.has(s) && s.bounces > SpikeballBlockData.BOUNCES_LEFT_BEFORE_SPAWN,
		);
		if(this.spikeballs.length === 0) {
			this.timeUntilSpawn --;
		}
		this.timeSinceSpawn ++;
		if(this.timeUntilSpawn < 0) {
			this.spawnSpikeballs(world);
			this.timeUntilSpawn = SpikeballBlockData.SPAWN_FREQUENCY;
			this.timeSinceSpawn = 0;
		}
	}
	updateDoors(world: World, canvasIO: CanvasIO) {
		for(const xDirection of ["left", "right"] as const) {
			for(const yDirection of ["up", "down"] as const) {
				const patternStep = this.pattern[this.patternStep];
				const direction = `${yDirection}-${xDirection}` as Diagonal;
				const open = (
					this.timeUntilSpawn < SpikeballBlockData.DOOR_OPENING_TIME
					&& patternStep.some(p => p[0] === xDirection && p[1] === yDirection)
				) || (
					this.doors[direction] === SpikeballBlockData.DOOR_OPENNESS
					&& this.timeSinceSpawn < SpikeballBlockData.DOOR_CLOSE_DELAY
				);
				const target = open ? SpikeballBlockData.DOOR_OPENNESS : 0;
				this.doors[direction] = GeomUtils.moveTowards(this.doors[direction], target, SpikeballBlockData.DOOR_OPENING_SPEED);
				if(open) {
					this.spawnParticles(xDirection, yDirection, world, canvasIO);
				}
			}
		}
	}
	spawnParticles(xDirection: "left" | "right", yDirection: "up" | "down", world: World, canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		const diagonal = `${yDirection}-${xDirection}` as Diagonal;
		const perpendicular = Directions.rotateClockwise[diagonal];
		for(let i = 0; i < SpikeballBlockData.PARTICLE_SPAWN_ATTEMPTS; i ++) {
			if(Math.random() < SpikeballBlockData.PARTICLE_SPAWN_PROBABILITY) {
				const offset = RandomUtils.random(-SpikeballBlockData.PARTICLE_PERPENDICULAR_OFFSET, SpikeballBlockData.PARTICLE_PERPENDICULAR_OFFSET);
				const velocity = RandomUtils.random(SpikeballBlockData.PARTICLE_MIN_VELOCITY, SpikeballBlockData.PARTICLE_MAX_VELOCITY);
				world.particles.add(new Particle(
					center.add(Vector.unit(perpendicular).multiply(offset)),
					Vector.unit(diagonal).multiply(velocity),
					SpikeballBlockData.PARTICLE_SETTINGS,
				), world, canvasIO);
			}
		}
	}

	spawnSpikeballs(world: World) {
		const spikeballs = [];
		for(const [xDirection, yDirection] of this.pattern[this.patternStep]) {
			if(this.canSpawnSpikeball(xDirection, yDirection, world)) {
				const spikeball = this.spawnSpikeball(xDirection, yDirection, world);
				spikeballs.push(spikeball);
			}
		}

		for(const spikeball of spikeballs) {
			for(const other of spikeballs.filter(s => s !== spikeball)) {
				spikeball.overlappingObjects.push(other);
			}
		}

		this.nextPatternStep(world);
	}
	nextPatternStep(world: World) {
		const initialStep = this.patternStep;
		let foundSpawnable = false;
		while(!foundSpawnable) {
			this.patternStep ++;
			this.patternStep %= this.pattern.length;
			for(const [xDirection, yDirection] of this.pattern[this.patternStep]) {
				if(this.canSpawnSpikeball(xDirection, yDirection, world)) {
					foundSpawnable = true;
				}
			}
			if(this.patternStep === initialStep && !foundSpawnable) { return false; }
		}
		return true;
	}
	isObstructedByTiles(xDirection: Direction, yDirection: Direction, world: World) {
		const tilePosition = this.tilePosition();
		const tileX = world.tiles.get(tilePosition.add(Vector.unit(xDirection)));
		const tileY = world.tiles.get(tilePosition.add(Vector.unit(yDirection)));
		const tileDiagonal = world.tiles.get(tilePosition.add(Vector.unit(xDirection)).add(Vector.unit(yDirection)));
		return !((tileX === EmptyTile.EMPTY || tileY === EmptyTile.EMPTY) && tileDiagonal === EmptyTile.EMPTY);
	}
	isObstructedByEntities(xDirection: Direction, yDirection: Direction, world: World) {
		const tilePosition = this.tilePosition();
		const opposite = tilePosition.add(Vector.unit(xDirection)).add(Vector.unit(yDirection));
		const tileBox = Rectangle.boundingBox([tilePosition, opposite]).extend("right", 1).extend("down", 1);
		const searchBox = tileBox.scale(WorldData.TILE_SIZE);
		const entities = (
			[...world.entities.collideablesIntersecting(searchBox)]
			.filter(e => e instanceof Player || e instanceof ThrowableTileEntity)
		);
		return entities.length !== 0;
	}
	canSpawnSpikeball(xDirection: Direction, yDirection: Direction, world: World) {
		return (
			!this.isObstructedByTiles(xDirection, yDirection, world)
			&& !this.isObstructedByEntities(xDirection, yDirection, world)
		);
	}
	spawnSpikeball(xDirection: "left" | "right", yDirection: "up" | "down", world: World) {
		const direction = Directions.createDiagonal[xDirection][yDirection];
		const spikeball = new Spikeball(
			this.hitbox.center().subtract(SpikeballData.RADIUS, SpikeballData.RADIUS),
			direction,
			world,
		);
		const tilePosition = this.tilePosition();
		spikeball.overlappingObjects.push(
			this,
			tilePosition.add(Vector.unit(xDirection)),
			tilePosition.add(Vector.unit(yDirection)),
			tilePosition.add(Vector.unit(xDirection)).add(Vector.unit(yDirection)),
		);
		this.spikeballs.push(spikeball);
		world.entities.add(spikeball);
		return spikeball;
	}

	static canSpawn(position: Vector, world: World) {
		const diagonals: [Direction, Direction][] = [
			["left", "up"],
			["left", "down"],
			["right", "up"],
			["right", "down"],
		];
		return diagonals.some(([xDirection, yDirection]) => {
			const block = SpikeballBlock.atTile(position);
			return block.canSpawnSpikeball(xDirection, yDirection, world);
		});
	}

	tilePosition() {
		return Tiles.getTileCoordinates(this.hitbox.center());
	}
}

LoadingManager.onload(() => {
	EntitySpawner.register(new Spawnable(
		"spikeballs",
		true,
		(tileRegion: Rectangle, safeRegion: Rectangle, world: World) => EntitySpawner.spawnEntities(
			tileRegion.area() / (RoomData.SIZE ** 2) * SpikeballBlockData.SPIKEBALLS_PER_ROOM,
			SpikeballBlockData.SPAWN_EVENNESS,
			tileRegion,
			[
				EntitySpawner.spawnRequirements.replaceSolid,
				EntitySpawner.spawnRequirements.noAdjacentGates,
				EntitySpawner.spawnRequirements.atLeast3RectEmpty,
				SpikeballBlock.canSpawn,
			],
			(position: Vector, world: World) => {
				world.tiles.set(position, EmptyTile.EMPTY);
				world.entities.add(SpikeballBlock.atTile(position, ArrayUtils.randomItem(SpikeballBlockData.PATTERNS)));
				return true;
			},
			safeRegion,
			world,
		),
	));
});
