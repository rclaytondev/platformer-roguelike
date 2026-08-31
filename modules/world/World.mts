import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Player } from "../Player.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { Entities } from "./Entities.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tile } from "../tiles/Tile.mjs";
import { Tiles } from "./Tiles.mjs";
import { WorldScreen } from "./WorldScreen.mjs";
import { Camera } from "./Camera.mjs";
import { WorldGenerator } from "../world-generator/WorldGenerator.mjs";
import { Renderable, Renderer } from "./Renderer.mjs";
import { Particles } from "../game-utilities/Particles.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { SlopeTile } from "../tiles/SlopeTile.mjs";
import { StaticEntities } from "../game-utilities/StaticEntity.mjs";

export type TileWithPosition = { position: Vector, tile: Tile };

export class World {
	tiles: Tiles = new Tiles();
	originalTiles: Tiles = new Tiles();
	entities: Entities = new Entities();
	particles: Particles = new Particles();
	worldScreen: WorldScreen | null = null;
	worldGenerator: WorldGenerator | null = null;
	player: Player;
	staticEntities: StaticEntities = new StaticEntities();

	frameCount: number = 0;

	constructor(enableGeneration: boolean, canvasIO: CanvasIO | null = null) {
		this.player = new Player(this, () => Debug.getInput(canvasIO));
		this.entities.add(this.player);
		if(enableGeneration) {
			this.worldGenerator = new WorldGenerator();
			this.worldGenerator.towerGenerator.initialize(this);
		}
	}

	render(canvasIO: CanvasIO, camera: Camera, renderer: Renderer) {
		this.entities.render(camera, renderer);
		this.staticEntities.render(renderer, this, camera);
		this.tiles.render(camera, renderer, canvasIO, this);
		this.particles.render(renderer);

		renderer.renderables.push(new Renderable(
			() => {
				canvasIO.ctx.save();
				camera.applyTranslation(canvasIO);
			},
			"camera-translation",
		));
		renderer.renderables.push(new Renderable(
			() => canvasIO.ctx.restore(),
			"reset-camera-translation",
		));
		renderer.renderables.push(new Renderable(
			() => Debug.displayMouseCoordinates(canvasIO, camera),
			"debug-mouse-coordinates",
		));
	}

	update(canvasIO: CanvasIO, camera?: Camera) {
		this.entities.update(camera);
		this.staticEntities.update(this, canvasIO);
		this.particles.update();
		this.worldGenerator?.update(this);
		this.frameCount ++;
	}

	onSlope(rectangle: Rectangle, normal: Diagonal, mode: "up" | "down") {
		const corner = rectangle.getCorner(({
			"up-left": "bottom-right",
			"up-right": "bottom-left",
			"down-left": "bottom-right",
			"down-right": "bottom-left",
		} as const)[normal]);
		const position = (mode === "up") ? new Vector(
			(normal === "up-right" || normal === "down-right") ? Math.ceil(corner.x / WorldData.TILE_SIZE) - 1 : Math.floor(corner.x / WorldData.TILE_SIZE),
			Math.ceil(corner.y / WorldData.TILE_SIZE) - 1,
		) : new Vector(
			(normal === "up-right" || normal === "down-right") ? Math.floor(corner.x / WorldData.TILE_SIZE) : Math.ceil(corner.x / WorldData.TILE_SIZE) - 1,
			Math.floor(corner.y / WorldData.TILE_SIZE),
		);
		const tile = this.tiles.get(position);
		return tile instanceof SlopeTile && tile.normal === normal && tile.slopeIntersectionDistance(rectangle, position, false) === 0;
	}
	isInSolid(rectangle: Rectangle, collides: (object: TileWithPosition | Entity) => boolean = () => true) {
		return this.tiles.colliding(rectangle, collides).length !== 0 || this.entities.collideablesIntersecting(rectangle, collides).size !== 0;
	}
	lineIntersectionDistance(position: Vector, direction: Vector, maxDistance: number, ignoredTiles: Tile[] = [], collides: (entity: Entity) => boolean = () => true) {
		return Math.min(
			this.tiles.rayIntersectionDistance(position, direction, maxDistance, ignoredTiles),
			this.entities.rayIntersectionDistance(position, direction, collides, maxDistance),
			maxDistance,
		);
	}
	rectIntersectionDistance(rect: Rectangle, direction: Direction, maxDistance: number, collides: (entity: Entity) => boolean) {
		return Math.min(
			this.tiles.rectIntersectionDistance(rect, direction, maxDistance),
			this.entities.rectIntersectionDistance(rect, direction, maxDistance, collides),
			maxDistance,
		);
	}
	hasLineOfSight(position: Vector, rectangle: Rectangle, collides: (entity: Entity) => boolean) {
		const center = rectangle.center();
		const direction = center.subtract(position);
		const distance = GeomUtils.rayIntersectsRectangle(position, direction, rectangle);
		return distance <= this.lineIntersectionDistance(position, direction, distance, [], collides);
	}

	angularMotionBlockers(point: Vector, direction: "clockwise" | "counterclockwise", collides: (e: Collideable) => boolean) {
		const blockers = new Set([
			...this.entities.angularMotionBlockers(point, collides),
			...this.tiles.angularMotionBlockers(point, direction),
		]);
		const opposite = (direction === "clockwise" ? "counterclockwise" : "clockwise");
		return [...blockers].filter(b => !blockers.has(Directions.rotate45[opposite][b]));
	}


	destroyTile(position: Vector) {
		this.tiles.set(position, EmptyTile.EMPTY);
	}
	addTile(position: Vector, tile: Tile) {
		this.tiles.set(position, tile);
	}
	removeTile(position: Vector) {
		this.tiles.set(position, EmptyTile.EMPTY);
	}
	addOriginalTile(position: Vector, tile: Tile) {
		this.addTile(position, tile);
		this.originalTiles.set(position, tile);
	}
	addEntityIfEmpty(entity: Collideable) {
		if(!entity.hitboxes().some(h => this.isInSolid(h))) {
			this.entities.add(entity);
			return true;
		}
		return false;
	}
	damage(hurtbox: Rectangle, damagesEntity: (e: Entity) => boolean = () => true, damagesTile: (t: Tile) => boolean = () => true) {
		this.entities.damage(hurtbox, damagesEntity);
		this.tiles.destroy(hurtbox, this, damagesTile);
	}

	static intersectingSolids(tiles: TileWithPosition[], entities: Iterable<Entity>) {
		const collideables = [...entities].filter(e => e instanceof Collideable);
		const entityCollisions = collideables.flatMap((e1, i1) => collideables.slice(i1 + 1).map(e2 => [e1, e2] as [Collideable, Collideable]));
		const tileCollisions = collideables.flatMap(e => tiles.filter(t => e.hitboxes().some(h => t.tile.intersects(h, t.position))).map(t => [e, t] as [Collideable, TileWithPosition]));
		return [...entityCollisions, ...tileCollisions];
	}
}
