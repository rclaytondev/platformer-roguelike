import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { PortalData, WorldData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { Particle } from "../game-utilities/Particle.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";
import { SpawnPoint } from "./SpawnPoint.mjs";

export class Portal extends Entity {
	position: Vector;

	constructor(position: Vector, world: World) {
		super(world);
		this.position = position;
	}

	update() {
		if(this.world.frameCount % PortalData.FRAMES_PER_LINE === 0) {
			this.addLine();
		}

		if(this.world.player.hitbox.intersects(this.teleportHitbox())) {
			this.teleportPlayer();
		}
	}
	teleportHitbox() {
		return Rectangle.fromDimensions(
			this.position.x - PortalData.HITBOX_WIDTH / 2, this.position.y - PortalData.HITBOX_HEIGHT,
			PortalData.HITBOX_WIDTH, PortalData.HITBOX_HEIGHT,
		);
	}
	addLine() {
		this.world.particles.add(new Particle(
			new Vector(
				this.position.x + RandomUtils.random(-PortalData.LINE_SPAWN_WIDTH / 2, PortalData.LINE_SPAWN_WIDTH / 2),
				this.position.y,
			),
			new Vector(0, -PortalData.LINE_SPEED),
			PortalData.PARTICLE_SETTINGS,
		), this.world);
	}
	teleportPlayer() {
		const generator = this.world.worldGenerator;
		if(generator) {
			if(generator.towerGenerator.levelsGenerated <= generator.towerGenerator.levelsVisited) {
				generator.towerGenerator.generate(this.world);
			}
			const nextLevel = generator.towerGenerator.nextLevelTileRectangle().scale(WorldData.TILE_SIZE);
			const nextSpawn = [...this.world.entities.possiblyIntersecting(nextLevel)].find(e => e instanceof SpawnPoint)!;
			this.world.player.hitbox.x = nextSpawn.position.x;
			this.world.player.hitbox.y = nextSpawn.position.y;
		}
	}

	render() {
		return [new Renderable(this.display.bind(this), "entity")];
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PortalData.COLOR;
		canvasIO.ctx.fillRect(
			this.position.x - PortalData.WIDTH / 2, this.position.y - PortalData.BASE_HEIGHT,
			PortalData.WIDTH, PortalData.BASE_HEIGHT,
		);
	}

	hitboxes() {
		return [];
	}
	boundingBox() {
		return Rectangle.fromDimensions(
			this.position.x - PortalData.WIDTH / 2,
			this.position.y - PortalData.HITBOX_HEIGHT,
			PortalData.WIDTH,
			PortalData.HITBOX_HEIGHT,
		);
	}
}
