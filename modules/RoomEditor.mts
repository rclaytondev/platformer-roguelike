import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { Room, RoomEntity, RoomTile } from "./level-generator/Room.mjs";
import { DEBUG_SETTINGS } from "./constants/DebugSettings.mjs";
import { Gate } from "./entities/Gate.mjs";
import { World } from "./world/World.mjs";
import { BackgroundData, PortalData, RoomData, WorldData } from "./constants/GameData.mjs";
import { ROOMS } from "./constants/Rooms.mjs";
import { InputUtils } from "./game-utilities/InputUtils.mjs";
import { Portal } from "./entities/Portal.mjs";
import { EmptyTile } from "./tiles/EmptyTile.mjs";
import { Platform } from "./tiles/Platform.mjs";
import { Tile } from "./tiles/Tile.mjs";
import { TowerTile } from "./tiles/TowerTile.mjs";
import { Tiles } from "./world/Tiles.mjs";
import { Camera } from "./world/Camera.mjs";
import { Renderable, Renderer } from "./world/Renderer.mjs";
import { Entities } from "./world/Entities.mjs";
import { TowerSlope } from "./tiles/TowerSlope.mjs";
import { TILE_TYPES } from "./tiles/TileIDs.mjs";
import { Chain } from "./entities/Chain.mjs";

abstract class EditorMode {
	abstract onLeftClick(tilePos: Vector, editor: RoomEditor): void;
	abstract onRightClick(tilePos: Vector, editor: RoomEditor): void;

	abstract uiLabel: string;
}

class SolidMode extends EditorMode {
	uiLabel: string = "solid";

	onLeftClick(tilePos: Vector, editor: RoomEditor): void {
		editor.setTile(tilePos, TowerTile.TOWER_TILE);
	}
	onRightClick(tilePos: Vector, editor: RoomEditor): void {
		editor.setTile(tilePos, EmptyTile.EMPTY);
	}
}

class PlatformMode extends EditorMode {
	uiLabel: string = "platform";

	onLeftClick(tilePos: Vector, editor: RoomEditor): void {
		editor.setTile(tilePos, Platform.PLATFORM);
	}
	onRightClick(tilePos: Vector, editor: RoomEditor): void {
		editor.setTile(tilePos, EmptyTile.EMPTY);
	}
}

class ExitTileMode extends EditorMode {
	uiLabel: string = "exit";

	onLeftClick(tilePos: Vector, editor: RoomEditor): void {
		if(Directions.isDirection(editor.direction)) {
			editor.room.exitTiles.set(tilePos, editor.direction);
		}
	}
	onRightClick(tilePos: Vector, editor: RoomEditor): void {
		editor.room.exitTiles.set(tilePos, "none");
	}
}

class GateMode extends EditorMode {
	open: boolean;
	uiLabel: "gate-open" | "gate-closed";
	constructor(open: boolean) {
		super();
		this.open = open;
		this.uiLabel = (open ? "gate-open" : "gate-closed");
	}

	onLeftClick(tilePos: Vector, editor: RoomEditor): void {
		if(Directions.isDirection(editor.direction)) {
			const gateExists = Gate.isGateAt(tilePos, editor.room.worldPart.entities);
			if(!gateExists) {
				const gate = Gate.atTile(tilePos, editor.direction, this.open);
				editor.addEntity(gate);
				editor.setTile(tilePos, EmptyTile.EMPTY);
			}
		}
	}
	onRightClick(tilePos: Vector, editor: RoomEditor): void {
		editor.filterEntities(e => !(e instanceof Gate && e.tilePosition().equals(tilePos)));
	}
}

class PortalMode extends EditorMode {
	uiLabel: string = "portal";

	static getPortalPosition(tilePosition: Vector) {
		return Tiles.getTileCoordinates(tilePosition.multiply(WorldData.TILE_SIZE).add(PortalData.WIDTH / 2, 0))
			.add(0, 1).multiply(WorldData.TILE_SIZE);
	}

	onLeftClick(tilePos: Vector, editor: RoomEditor): void {
		const portalPosition = PortalMode.getPortalPosition(tilePos);
		if(![...editor.room.worldPart.entities].some(p => p instanceof Portal && p.position.equals(portalPosition))) {
			editor.addEntity(new Portal(portalPosition));
		}
	}
	onRightClick(tilePos: Vector, editor: RoomEditor): void {
		const portalPosition = PortalMode.getPortalPosition(tilePos);
		editor.filterEntities(e => !(e instanceof Portal && e.position.equals(portalPosition)));
	}
}

class SlopeMode extends EditorMode {
	uiLabel: string = "slope";

	onLeftClick(tilePos: Vector, editor: RoomEditor): void {
		if(Directions.isDiagonal(editor.direction)) {
			const normal = Directions.opposite[editor.direction];
			editor.setTile(tilePos, TowerSlope.fromNormal(normal));
		}
	}
	onRightClick(tilePos: Vector, editor: RoomEditor): void {
		editor.setTile(tilePos, EmptyTile.EMPTY);
	}
}

class ChainMode extends EditorMode {
	uiLabel: string = "chain";

	onLeftClick(tilePos: Vector, editor: RoomEditor): void {
		if(Chain.isChainAt(tilePos, editor.room.worldPart.entities)) { return; }

		const chainAbove = Chain.getChainAt(tilePos.add(0, -1), editor.room.worldPart.entities);
		const chainBelow = Chain.getChainAt(tilePos.add(0, 1), editor.room.worldPart.entities);
		if(chainAbove && chainBelow) {
			editor.deleteEntity(chainBelow);
			chainAbove.height += chainBelow.height + 1;
		}
		else if(chainAbove) {
			chainAbove.height ++;
		}
		else if(chainBelow) {
			chainBelow.tilePosition.y --;
			chainBelow.height ++;
		}
		else {
			editor.addEntity(new Chain(tilePos, 1));
		}
	}
	onRightClick(tilePos: Vector, editor: RoomEditor): void {
		const chain = Chain.getChainAt(tilePos, editor.room.worldPart.entities);
		if(!chain) { return; }
		if(chain.height === 1) {
			editor.deleteEntity(chain);
			return;
		}
		else if(chain.tilePosition.y === tilePos.y) {
			chain.height --;
			chain.tilePosition.y ++;
		}
		else if(chain.tilePosition.y === tilePos.y - chain.height + 1) {
			chain.height --;
		}
		else {
			const originalHeight = chain.height;
			chain.height = tilePos.y - chain.tilePosition.y;
			editor.addEntity(new Chain(tilePos, originalHeight - chain.height));
		}
	}
}


export class RoomEditor {
	room: Room;
	mode: EditorMode;
	direction: Direction | Diagonal = "right";
	static readonly MODES = [
		new SolidMode(),
		new PlatformMode(),
		new ExitTileMode(),
		new GateMode(true),
		new GateMode(false),
		new PortalMode(),
		new SlopeMode(),
		new ChainMode(),
	] as const;

	constructor(room: Room) {
		this.room = room;
		this.mode = RoomEditor.MODES[0];
	}
	getWorld() {
		const world = new World(false);
		for(const [tile, position] of this.room.worldPart.tiles.entries()) {
			world.tiles.set(position, tile);
			world.originalTiles.set(position, tile);
		}
		for(const entity of this.room.worldPart.entities) {
			world.entities.add(entity);
		}
		return world;
	}


	update(canvasIO: CanvasIO) {
		this.checkForClicks(canvasIO);
		this.checkForKeyPresses(canvasIO);

		const numberKeys = canvasIO.numberKeys();
		if(numberKeys.length !== 0) {
			const key = numberKeys[0];
			if(key > 0 && key <= RoomEditor.MODES.length) {
				this.mode = RoomEditor.MODES[key - 1];
			}
		}
	}
	checkForClicks(canvasIO: CanvasIO) {
		if(canvasIO.mouse.pressed) {
			const tilePosition = Tiles.getTileCoordinates(canvasIO.mouse.position);
			if(canvasIO.mouse.button === "left") {
				this.mode.onLeftClick(tilePosition, this);
			}
			else {
				this.mode.onRightClick(tilePosition, this);
			}
		}
	}
	setTile(position: Vector, tile: RoomTile) {
		this.room.worldPart.tiles.set(position, tile);
	}
	checkForKeyPresses(canvasIO: CanvasIO) {
		if(canvasIO.keys[DEBUG_SETTINGS.EDITOR.LOG_KEY]) {
			this.logBlocks();
		}
		this.updateDirection(canvasIO);
		if(canvasIO.keys.Equal && !InputUtils.pastKeys.Equal) {
			this.loadNextRoom();
		}
		else if(canvasIO.keys.Minus && !InputUtils.pastKeys.Minus) {
			this.loadPreviousRoom();
		}
	}
	updateDirection(canvasIO: CanvasIO) {
		const KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
		if(KEYS.some(k => canvasIO.keys[k] && !InputUtils.pastKeys[k])) {
			this.direction = canvasIO.keyDirection(true) ?? this.direction;
		}
	}
	loadRoom(room: Room) {
		this.room = room;
	}
	loadNextRoom() {
		const index = ROOMS.indexOf(this.room);
		if(index < ROOMS.length - 1) {
			this.loadRoom(ROOMS[index + 1]);
			// eslint-disable-next-line no-console
			console.log(`loaded room ${index + 1} (${ROOMS[index + 1].name}) in the editor`);
		}
	}
	loadPreviousRoom() {
		const index = ROOMS.indexOf(this.room);
		if(index > 0) {
			this.loadRoom(ROOMS[index - 1]);
			// eslint-disable-next-line no-console
			console.log(`loaded room ${index - 1} (${ROOMS[index - 1].name}) in the editor`);
		}
	}

	render(canvasIO: CanvasIO, renderer: Renderer) {
		const world = this.getWorld();
		world.render(canvasIO, new Camera(canvasIO.boundingBox().center()), renderer);
		renderer.renderables.push(
			new Renderable(
				() => canvasIO.fillCanvas(BackgroundData.BACKGROUND_COLOR),
				"editor-background",
			),
			new Renderable(
				() => {
					this.displayHoveredTile(canvasIO);
					this.displayExits(canvasIO);
					this.displayInfo(canvasIO);
				},
				"editor-ui",
			),
		);
	}

	addEntity(entity: RoomEntity) {
		this.room.worldPart.entities.add(entity);
	}
	deleteEntity(entity: RoomEntity) {
		this.room.worldPart.entities.delete(entity);
	}
	filterEntities(callback: (entity: RoomEntity) => boolean) {
		this.room.worldPart.entities = new Entities([...this.room.worldPart.entities].filter(callback));
	}


	displayHoveredTile(canvasIO: CanvasIO) {
		const position = Tiles.getTileCoordinates(canvasIO.mouse.position).multiply(WorldData.TILE_SIZE);
		canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.EDITOR.HOVERED_TILE_COLOR;
		canvasIO.ctx.strokeRect(position.x, position.y, WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	}
	displayArrow(canvasIO: CanvasIO, position: Vector, direction: Direction) {
		canvasIO.drawArrow(
			position.add(1/2, 1/2).multiply(WorldData.TILE_SIZE),
			WorldData.TILE_SIZE / 3,
			direction,
		);
	}
	displayExits(canvasIO: CanvasIO) {
		for(const [tile, position] of this.room.exitTiles.entries()) {
			canvasIO.ctx.strokeStyle = DEBUG_SETTINGS.EDITOR.EXIT_TILE_COLOR;
			this.displayArrow(canvasIO, position, tile as Direction);
		}
	}
	displayInfo(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = DEBUG_SETTINGS.EDITOR.UI_COLOR;
		canvasIO.ctx.textAlign = "right";
		canvasIO.ctx.textBaseline = "top";
		canvasIO.ctx.font = "30px monospace";
		canvasIO.ctx.fillText(this.mode.uiLabel, canvasIO.canvas.width, 0);
		canvasIO.ctx.fillText(this.direction, canvasIO.canvas.width, 30);
	}

	getTileIDs() {
		const ids: number[][] = [];
		for(let y = 0; y < RoomData.SIZE; y ++) {
			ids.push([]);
			for(let x = 0; x < RoomData.SIZE; x ++) {
				const id = (TILE_TYPES as Tile[]).indexOf(this.room.worldPart.tiles.get(x, y));
				ids[ids.length - 1].push(id);
			}
		}
		return ids;
	}
	getLogString() {
		let result = "[\n";
		result += this.getTileIDs().map(row => `\t[${row.join(", ")}]`).join(",\n");
		result += "\n],\n[\n";
		for(const [direction, position] of this.room.exitTiles.entries()) {
			result += `\t{ x: ${position.x}, y: ${position.y}, direction: "${direction}" },\n`;
		}
		result += "],\n[\n";
		for(const entity of this.room.worldPart.entities) {
			if(entity instanceof Portal) {
				result += `\tnew Portal(new Vector${entity.position}),\n`;
			}
			else if(entity instanceof Gate) {
				const position = entity.tilePosition();
				result += `\tGate.atTile(new Vector(${position.x}, ${position.y}), "${entity.direction}", ${entity.toggled}),\n`;
			}
			else if(entity instanceof Chain) {
				result += `\tnew Chain(new Vector(${entity.tilePosition.x}, ${entity.tilePosition.y}), ${entity.height}),\n`;
			}
		}
		result += "],";
		return result;
	}
	logBlocks() {
		// eslint-disable-next-line no-console
		console.log(this.getLogString());
	}
}
