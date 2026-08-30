import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";

export abstract class Entity {
	world: World;

	constructor(world: World) {
		this.world = world;
	}

	abstract render(): Renderable[];
	abstract display(canvasIO: CanvasIO): void;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	displayDebug(canvasIO: CanvasIO) { }

	abstract update(): void;
	abstract boundingBox(): Rectangle;

	deathParticleCenter() {
		return this.boundingBox().center();
	}
}
