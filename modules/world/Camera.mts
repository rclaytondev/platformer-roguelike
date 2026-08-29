import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { WorldBorder } from "../entities/WorldBorder.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { Entities } from "./Entities.mjs";

export class Camera {
	#canvasIO: CanvasIO;
	position: Vector;

	constructor(position: Vector, canvasIO: CanvasIO) {
		this.position = position;
		this.#canvasIO = canvasIO;
	}

	translation() {
		return new Vector(this.#canvasIO.canvas.width / 2 - this.position.x, this.#canvasIO.canvas.height / 2 - this.position.y);
	}
	applyTranslation(canvasIO: CanvasIO) {
		const translation = this.translation();
		canvasIO.ctx.translate(translation.x, translation.y);
	}

	static visibleRegion(canvasIO: CanvasIO, position: Vector, offscreenAmount: number) {
		return Rectangle.fromBounds(
			position.x - canvasIO.canvas.width / 2 - offscreenAmount,
			position.x + canvasIO.canvas.width / 2 + offscreenAmount,
			position.y - canvasIO.canvas.height / 2 - offscreenAmount,
			position.y + canvasIO.canvas.height / 2 + offscreenAmount,
		);
	}
	visibleRegion(offscreenAmount: number) {
		return Camera.visibleRegion(this.#canvasIO, this.position, offscreenAmount);
	}
	visibleTileRegion(offscreenTiles: number = 0) {
		const center = this.position.divide(WorldData.TILE_SIZE);
		return Rectangle.fromBounds(
			Math.floor(center.x - (this.#canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)) - offscreenTiles,
			Math.ceil(center.x + (this.#canvasIO.canvas.width / 2 / WorldData.TILE_SIZE)) + offscreenTiles,
			Math.floor(center.y - (this.#canvasIO.canvas.height / 2 / WorldData.TILE_SIZE)) - offscreenTiles,
			Math.ceil(center.y + (this.#canvasIO.canvas.height / 2 / WorldData.TILE_SIZE)) + offscreenTiles,
		);
	}

	static isCameraPositionValid(position: Vector, entities: Entities, canvasIO: CanvasIO) {
		const rect = Camera.visibleRegion(canvasIO, position, 0);
		const collideables = [...entities.collideablesIntersecting(rect)];
		const worldBorders = collideables.filter(e => e instanceof WorldBorder);
		return worldBorders.length === 0;
	}
	moveCameraIfValid(offset: Vector, entities: Entities) {
		const validBefore = Camera.isCameraPositionValid(this.position, entities, this.#canvasIO);
		const validAfter = Camera.isCameraPositionValid(this.position.add(offset), entities, this.#canvasIO);
		if(!validBefore || validAfter) {
			this.position = this.position.add(offset);
			return true;
		}
		return false;
	}
	update(target: Vector, entities: Entities) {
		if(!Debug.freeCameraMode) {
			const newPosition = GeomUtils.moveVectorTowards(this.position, target, WorldData.CAMERA_SPEED);
			this.moveCameraIfValid(new Vector(newPosition.x - this.position.x, 0), entities);
			this.moveCameraIfValid(new Vector(0, newPosition.y - this.position.y), entities);
		}
		Debug.updateFreeCameraMode(this);
	}
}
