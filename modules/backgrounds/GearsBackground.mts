import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { BackgroundData, BackgroundGearLayerData, LevelGeneratorData, RoomData, WorldData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { Camera } from "../world/Camera.mjs";
import { Background } from "./Background.mjs";

class BackgroundGear {
	position: Vector;
	size: number;
	teeth: number;
	innerRadiusRatio: number;
	speed: number;
	startAngle: number;
	color: string;
	image: HTMLCanvasElement | null = null;

	constructor(position: Vector, size: number, teeth: number, innerRadiusRatio: number, speed: number, color: string, startAngle: number) {
		this.position = position;
		this.size = size;
		this.teeth = teeth;
		this.innerRadiusRatio = innerRadiusRatio;
		this.speed = speed;
		this.color = color;
		this.startAngle = startAngle;
	}

	getRenderImage(blur: number) {
		const margin = blur;
		const canvas = document.createElement("canvas");
		canvas.width = 2 * (this.size + margin);
		canvas.height = 2 * (this.size + margin);
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = this.color;
		ctx.save();
		ctx.filter = `blur(${blur}px)`;
		ctx.translate(this.size + margin, this.size + margin);
		ctx.beginPath();
		ctx.moveTo(this.size, 0);
		for(let i = 0; i < this.teeth; i ++) {
			const angle1 = 360 * (2 * i) / (2 * this.teeth);
			const angle2 = 360 * (2 * i + 1) / (2 * this.teeth);
			const angle3 = 360 * (2 * i + 2) / (2 * this.teeth);
			const point = new Vector(Math.cos(MathUtils.toRadians(angle2)), -Math.sin(MathUtils.toRadians(angle2))).multiply(this.size * this.innerRadiusRatio);
			ctx.arc(0, 0, this.size, -MathUtils.toRadians(angle1), -MathUtils.toRadians(angle2), true);
			ctx.lineTo(point.x, point.y);
			ctx.arc(0, 0, this.size * this.innerRadiusRatio, -MathUtils.toRadians(angle2), -MathUtils.toRadians(angle3), true);
		}
		ctx.fill();
		ctx.restore();
		return canvas;
	}
	display(position: Vector, blur: number, frameCount: number, canvasIO: CanvasIO) {
		if(!this.image) {
			this.image = this.getRenderImage(blur);
		}
		canvasIO.ctx.save();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate((this.startAngle + this.speed * frameCount) * Math.PI / 180);
		canvasIO.ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
		canvasIO.ctx.restore();
	}
	static isVisible(position: Vector, size: number, canvasIO: CanvasIO) {
		return (
			position.x + size > 0 && position.x - size < canvasIO.canvas.width &&
			position.y + size > 0 && position.y - size < canvasIO.canvas.height
		);
	}

	intersects(gear: BackgroundGear, parallax: number) {
		const distX = GeomUtils.signedModularDistance(this.position.x, gear.position.x, BackgroundData.BACKGROUND_REPEAT_SIZE);
		const distY = GeomUtils.signedModularDistance(this.position.y, gear.position.y, BackgroundData.BACKGROUND_REPEAT_SIZE);
		const distance = Math.sqrt(distX ** 2 + distY ** 2);
		return distance * parallax < this.size + gear.size;
	}
}

class GearLayer {
	parallax: number;
	blur: number;
	gears: BackgroundGear[];

	constructor(parallax: number, blur: number, gears: BackgroundGear[]) {
		this.parallax = parallax;
		this.blur = blur;
		this.gears = gears;
	}

	display(cameraPosition: Vector, frameCount: number, canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		for(const gear of this.gears) {
			const repeatedPosition = new Vector(
				cameraPosition.x + GeomUtils.signedModularDistance(cameraPosition.x, gear.position.x, BackgroundData.BACKGROUND_REPEAT_SIZE),
				cameraPosition.y + GeomUtils.signedModularDistance(cameraPosition.y, gear.position.y, BackgroundData.BACKGROUND_REPEAT_SIZE),
			);
			const position = repeatedPosition.subtract(cameraPosition).multiply(this.parallax).add(canvasIO.canvas.width / 2, canvasIO.canvas.height / 2);
			if(BackgroundGear.isVisible(position, gear.size, canvasIO)) {
				gear.display(position, this.blur, frameCount, canvasIO);
			}
		}
		canvasIO.ctx.restore();
	}

	static generate(info: BackgroundGearLayerData) {
		const gears: BackgroundGear[] = [];
		const numGears = BackgroundData.BACKGROUND_REPEAT_SIZE ** 2 * info.density;
		for(let i = 0; i < numGears; i ++) {
			let spawned = false;
			let attempts = 0;
			while(!spawned) {
				attempts ++;
				const [position] = RandomUtils.randomEvenlySpaced({
					generate: () => RandomUtils.randomInRect(Rectangle.square(0, 0, BackgroundData.BACKGROUND_REPEAT_SIZE), RandomUtils.randomInt),
					metric: (v1, v2) => GeomUtils.toroidalDistance(v1, v2, BackgroundData.BACKGROUND_REPEAT_SIZE),
					amount: 1,
					trials: info.evenness,
				});
				const gear = new BackgroundGear(
					position,
					RandomUtils.random(info.minSize, info.maxSize),
					RandomUtils.randomInt(info.minTeeth, info.maxTeeth),
					RandomUtils.random(info.minInnerRadius, info.maxInnerRadius),
					RandomUtils.random(info.minSpeed, info.maxSpeed) * (Math.random() < 0.5 ? 1 : -1),
					info.color,
					RandomUtils.randomInt(0, 360),
				);
				if(!gears.some(g => g.intersects(gear, info.parallax))) {
					gears.push(gear);
					spawned = true;
				}
				else if(attempts > BackgroundData.MAX_GEAR_SPAWN_ATTEMPTS) {
					spawned = true;
				}
			}
		}
		return new GearLayer(info.parallax, info.blur, gears);
	}
}

export class GearsBackground extends Background {
	zIndex: number = 1;
	frameCount: number = 0;

	layers: GearLayer[];
	constructor(layers: GearLayer[]) {
		super();
		this.layers = layers;
	}

	display(canvasIO: CanvasIO, camera: Camera) {
		const translation = camera.translation();
		canvasIO.ctx.save();
		canvasIO.clipRect(
			translation.x, 0,
			LevelGeneratorData.WIDTH * RoomData.SIZE * WorldData.TILE_SIZE,
			canvasIO.canvas.height,
		);
		canvasIO.fillCanvas(BackgroundData.BACKGROUND_COLOR);
		for(let i = this.layers.length - 1; i >= 0; i --) {
			this.layers[i].display(camera.position, this.frameCount, canvasIO);
		}
		canvasIO.ctx.restore();
	}
	update() {
		this.frameCount ++;
	}

	static generate() {
		return new GearsBackground(BackgroundData.LAYERS.map(l => GearLayer.generate(l)));
	}
}
