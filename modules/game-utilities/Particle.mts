import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { RenderingID } from "../constants/RenderingOrder.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { GraphicsUtils } from "./GraphicsUtils.mjs";
import { RandomUtils } from "./RandomUtils.mjs";

type Range = { min: number, max: number };
export type ParticleSettings = {
	color: { red: number, green: number, blue: number };
	size: number | Range;

	opacity?: number | Range;
	opacityDecay?: number | Range;
	shape?: "circle" | number | ((canvasIO: CanvasIO) => void);
	gravity?: number | Range;
	sizeDecay?: number | Range;
	rotationalVelocity?: number | Range;
	rotation?: number | Range;
	colorVariance?: number;
	solid?: boolean;
	thickness?: number | Range;
	glowSize?: number | Range;
	glowIntensity?: number | Range;
	grayscaleColorVariance?: number;
	renderingID?: RenderingID;
};

export class Particle {
	position: Vector;
	velocity: Vector;

	size: number;
	color: string;

	opacity: number;
	opacityDecay: number;
	shape: "circle" | number | ((canvasIO: CanvasIO) => void);
	gravity: number;
	sizeDecay: number;
	rotationalVelocity: number;
	rotation: number;
	solid: boolean;
	glowSize: number;
	glowIntensity: number;
	thickness: number;
	renderingID: RenderingID;

	static randomize(info: number | Range) {
		if(typeof info === "number") {
			return info;
		}
		return RandomUtils.random(info.min, info.max);
	}

	constructor(position: Vector, velocity: Vector, settings: ParticleSettings) {
		this.position = position;
		this.velocity = velocity;

		this.size = Particle.randomize(settings.size);

		if(settings.colorVariance) {
			const red = settings.color.red + RandomUtils.random(-settings.colorVariance, settings.colorVariance);
			const green = settings.color.green + RandomUtils.random(-settings.colorVariance, settings.colorVariance);
			const blue = settings.color.blue + RandomUtils.random(-settings.colorVariance, settings.colorVariance);
			this.color = `rgb(${red}, ${green}, ${blue})`;
		}
		else if(settings.grayscaleColorVariance) {
			const offset = RandomUtils.random(-settings.grayscaleColorVariance, settings.grayscaleColorVariance);
			this.color = `rgb(${settings.color.red + offset}, ${settings.color.green + offset}, ${settings.color.blue + offset})`;
		}
		else {
			this.color = `rgb(${settings.color.red}, ${settings.color.green}, ${settings.color.blue})`;
		}

		this.opacity = Particle.randomize(settings.opacity ?? 1);
		this.opacityDecay = Particle.randomize(settings.opacityDecay ?? 1/20);
		this.shape = settings.shape ?? "circle";
		this.gravity = Particle.randomize(settings.gravity ?? 0);
		this.sizeDecay = Particle.randomize(settings.sizeDecay ?? 0);
		this.rotationalVelocity = Particle.randomize(settings.rotationalVelocity ?? 0);
		this.rotation = Particle.randomize(settings.rotation ?? { min: 0, max: 2 * Math.PI });
		this.solid = settings.solid ?? true;
		this.glowSize = Particle.randomize(settings.glowSize ?? 0);
		this.glowIntensity = Particle.randomize(settings.glowIntensity ?? 1);
		this.thickness = Particle.randomize(settings.thickness ?? 1);
		this.renderingID = settings.renderingID ?? "particle";
	}

	render() {
		return [
			new Renderable(this.display.bind(this), this.renderingID),
			new Renderable(this.displayGlow.bind(this), "glow"),
		];
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		canvasIO.ctx.translate(this.position.x, this.position.y);
		canvasIO.ctx.rotate(this.rotation);
		canvasIO.ctx.fillStyle = this.color;
		canvasIO.ctx.strokeStyle = this.color;
		canvasIO.ctx.lineWidth = this.thickness;
		canvasIO.ctx.globalAlpha = this.opacity;
		if(this.solid) {
			if(this.shape === "circle") {
				canvasIO.fillCircle(0, 0, this.size);
			}
			else if(typeof this.shape === "number") {
				canvasIO.fillRegularPoly(new Vector(0, 0), this.size, this.shape);
			}
			else { this.shape(canvasIO); }
		}
		else {
			if(this.shape === "circle") {
				canvasIO.strokeCircle(0, 0, this.size);
			}
			else if(typeof this.shape === "number") {
				canvasIO.strokeRegularPoly(new Vector(0, 0), this.size, this.shape);
			}
			else { this.shape(canvasIO); }
		}
		canvasIO.ctx.restore();
	}
	displayGlow(canvasIO: CanvasIO) {
		GraphicsUtils.glowCircle(
			this.position.x, this.position.y,
			this.glowSize, this.glowIntensity * this.opacity,
			canvasIO,
			255, 255, 255,
		);
	}

	update() {
		this.velocity = this.velocity.add(0, this.gravity);
		this.position = this.position.add(this.velocity);
		this.rotation += this.rotationalVelocity;
		this.size = Math.max(0, this.size - this.sizeDecay);
		this.opacity = Math.max(0, this.opacity - this.opacityDecay);
	}

	lifetime() {
		return Math.min(this.size / this.sizeDecay, this.opacity / this.opacityDecay);
	}
	isDead() {
		return this.size <= 0 || this.opacity <= 0;
	}
}
