import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DeathParticleData } from "../constants/GameData.mjs";
import { Entity } from "./Entity.mjs";
import { Particle } from "./Particle.mjs";
import { RandomUtils } from "./RandomUtils.mjs";


export class DeathParticle extends Particle {
	entity: Entity;
	image: CanvasIO;
	constructor(entity: Entity, position: Vector) {
		super(
			position,
			RandomUtils.randomWithMagnitude(DeathParticleData.VELOCITY),
			{
				color: { red: 0, green: 0, blue: 0 }, // unused
				size: DeathParticleData.INITIAL_SCALE,
				sizeDecay: DeathParticleData.SCALE_DECAY,
				opacityDecay: 0,
				shape: (c: CanvasIO) => this.displayDeathParticle(c),
			},
		);
		this.image = DeathParticle.getImage(entity, position);
		this.entity = entity;
	}
	static getImage(entity: Entity, position: Vector) {
		const image = new CanvasIO();
		image.ctx.translate(-position.x, -position.y);
		entity.display(image);
		return image;
	}

	displayDeathParticle(canvasIO: CanvasIO) {
		canvasIO.ctx.scale(this.size, this.size);
		canvasIO.ctx.drawImage(this.image.canvas, 0, 0);
	}
}
