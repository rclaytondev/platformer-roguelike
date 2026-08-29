import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { canvasIO } from "../app-entry-points/CanvasIOInitializer.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { ROOMS } from "../constants/Rooms.mjs";
import { Main } from "../Main.mjs";
import { RoomEditor } from "../RoomEditor.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { Camera } from "../world/Camera.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { InputUtils } from "./InputUtils.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { GameUtils } from "./GameUtils.mjs";

export class Debug {
	static recordedRNG: number[] = [];
	static rngOverrideIndex = 0;
	static initializeRNGOverride() {
		const oldRandom = Math.random;
		Math.random = () => {
			const result = (Debug.rngOverrideIndex < DEBUG_SETTINGS.RNG.OVERRIDE_VALUES.length)
				? DEBUG_SETTINGS.RNG.OVERRIDE_VALUES[Debug.rngOverrideIndex]
				: oldRandom();
			Debug.rngOverrideIndex ++;
			Debug.recordedRNG.push(result);
			return result;
		};
	}
	static checkRNGLogging(canvasIO: CanvasIO) {
		if(DEBUG_SETTINGS.RNG.LOG_KEY != null && canvasIO.keys[DEBUG_SETTINGS.RNG.LOG_KEY]) {
			// eslint-disable-next-line no-console
			console.log(Debug.recordedRNG.join(", "));
			// eslint-disable-next-line no-console
			console.log(Debug.recordedInput.map(input => JSON.stringify(input)).join(", "));
		}
	}

	static initializeEditor() {
		const room = (
			(typeof DEBUG_SETTINGS.EDITOR.ROOM === "number") ? ROOMS[DEBUG_SETTINGS.EDITOR.ROOM]
			: (typeof DEBUG_SETTINGS.EDITOR.ROOM === "string") ? ROOMS.find(r => r.name === DEBUG_SETTINGS.EDITOR.ROOM)
			: [...ROOMS].reverse().find(r => !r.name.includes("-reflected") && !r.name.includes("-toggled"))
		);
		if(!room) {
			throw new Error(`Room "${DEBUG_SETTINGS.EDITOR.ROOM}" does not exist.`);
		}

		// eslint-disable-next-line no-console
		console.log(`loaded room ${room.name} in the editor`);
		Main.screen = new RoomEditor(room);
	}

	static frameTimes: number[] = [];
	static updateFramerate() {
		if(!DEBUG_SETTINGS.SHOW_FRAMERATE) { return; }
		const now = Date.now();
		Debug.frameTimes.push(now);
		while(Debug.frameTimes[0] < now - 1000) {
			Debug.frameTimes.shift();
		}
	}
	static displayFramerate(canvasIO: CanvasIO) {
		canvasIO.ctx.resetTransform();
		if(!DEBUG_SETTINGS.SHOW_FRAMERATE) { return; }
		canvasIO.ctx.fillStyle = "red";
		canvasIO.ctx.textBaseline = "top";
		canvasIO.ctx.textAlign = "right";
		canvasIO.ctx.font = "30px monospace";
		canvasIO.ctx.fillText(`${Debug.frameTimes.length} FPS`, canvasIO.ctx.canvas.width - 10, 0);
	}
	static displayMouseCoordinates(canvasIO: CanvasIO, camera: Camera, display: boolean = DEBUG_SETTINGS.SHOW_MOUSE_COORDINATES) {
		if(!display) { return; }
		canvasIO.ctx.fillStyle = "rgb(200, 200, 200)";
		const coordinates = canvasIO.mouse.position.subtract(camera.translation()).divide(WorldData.TILE_SIZE).floor();
		canvasIO.ctx.font = "20px monospace";
		canvasIO.ctx.textAlign = "left";
		canvasIO.ctx.textBaseline = "top";
		canvasIO.ctx.fillText(coordinates.toString(), canvasIO.mouse.position.x, canvasIO.mouse.position.y);
	}

	static freeCameraMode = false;
	static updateFreeCameraMode(camera: Camera) {
		if(canvasIO?.keys.Enter && !InputUtils.pastKeys.Enter && DEBUG_SETTINGS.FREE_CAMERA_MODE) {
			Debug.freeCameraMode = !Debug.freeCameraMode;
		}

		const keyDirection = canvasIO!.keyDirection(true);
		if(keyDirection != null && Debug.freeCameraMode) {
			camera.position = camera.position.add(Vector.gridUnit(keyDirection).multiply(DEBUG_SETTINGS.FREE_CAMERA_MODE.SPEED));
		}
	}


	static recordedInput: { [key: string]: boolean }[] = [];
	static getInput(canvasIO: CanvasIO) {
		if(GameUtils.frameCount < DEBUG_SETTINGS.INPUT_RECORD.length) {
			return DEBUG_SETTINGS.INPUT_RECORD[GameUtils.frameCount];
		}
		return canvasIO.keys;
	}
	static updateInputRecord(canvasIO: CanvasIO) {
		const keys = Object.keys(canvasIO.keys).filter(k => canvasIO.keys[k]);
		Debug.recordedInput.push(Object.fromEntries(keys.map(k => [k, true])));
	}
}

LoadingManager.onload(Debug.initializeRNGOverride);
