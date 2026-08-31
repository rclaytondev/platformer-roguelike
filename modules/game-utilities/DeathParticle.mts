import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { DeathParticleData } from "../constants/GameData.mjs";
import { Entity } from "./Entity.mjs";
import { Particle } from "./Particle.mjs";
import { RandomUtils } from "./RandomUtils.mjs";


export class DeathParticle extends Particle {
	entity: Entity;
	image: CanvasIO;
	flashingImage: CanvasIO;
	age: number = 0;
	constructor(entity: Entity, position: Vector) {
		super(
			position,
			new Vector(DeathParticleData.VELOCITY, 0).rotate(-RandomUtils.random(45, 90 + 45)),
			{
				color: { red: 0, green: 0, blue: 0 }, // unused
				size: DeathParticleData.INITIAL_SCALE,
				sizeDecay: DeathParticleData.SCALE_DECAY,
				opacityDecay: 0,
				rotation: 0,
				gravity: DeathParticleData.GRAVITY,
				rotationalVelocity: {
					min: -DeathParticleData.ROTATION_AMOUNT,
					max: DeathParticleData.ROTATION_AMOUNT,
				},
				shape: (c: CanvasIO) => this.displayDeathParticle(c),
			},
		);
		this.image = DeathParticle.getImage(entity, position);
		this.flashingImage = DeathParticle.getFlashingImage(this.image);
		this.entity = entity;
	}
	static getImage(entity: Entity, position: Vector) {
		const boundingBox = entity.deathParticleBox();
		const image = new CanvasIO();
		image.canvas.width = boundingBox.width;
		image.canvas.height = boundingBox.height;
		image.ctx.translate(image.canvas.width / 2 - position.x, image.canvas.height / 2 - position.y);
		entity.display(image);
		return image;
	}
	static getFlashingImage(image: CanvasIO) {
		const flashingImage = new CanvasIO();
		flashingImage.canvas.width = image.canvas.width;
		flashingImage.canvas.height = image.canvas.height;
		flashingImage.ctx.drawImage(image.canvas, 0, 0);
		flashingImage.ctx.globalCompositeOperation = "source-atop";
		flashingImage.ctx.fillStyle = "white";
		flashingImage.ctx.fillRect(0, 0, flashingImage.canvas.width, flashingImage.canvas.height);
		return flashingImage;
	}

	update(): void {
		if(this.doneFlashing()) {
			super.update();
			this.sizeDecay += DeathParticleData.SCALE_ACCELERATION;
		}
		this.age ++;
	}
	doneFlashing() {
		return this.age >= (DeathParticleData.FLASHING.DURATION + DeathParticleData.FLASHING.PAUSE * DeathParticleData.FLASHING.COUNT);
	}
	isFlashing() {
		return (
			!this.doneFlashing()
			&& this.age % (DeathParticleData.FLASHING.DURATION + DeathParticleData.FLASHING.PAUSE) <= DeathParticleData.FLASHING.DURATION
		);
	}
	displayDeathParticle(canvasIO: CanvasIO, isFlashing: boolean = this.isFlashing()) {
		const image = isFlashing ? this.flashingImage : this.image;
		canvasIO.ctx.scale(this.size, this.size);
		canvasIO.ctx.drawImage(image.canvas, -this.image.canvas.width / 2, -this.image.canvas.height / 2);
	}
}
