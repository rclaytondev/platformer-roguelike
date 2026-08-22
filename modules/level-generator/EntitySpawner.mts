import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { RandomUtils } from "../game-utilities/RandomUtils.mjs";
import { Gate } from "../entities/Gate.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { World } from "../world/World.mjs";
import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { EmptyTile } from "../tiles/EmptyTile.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Portal } from "../entities/Portal.mjs";
import { Spawnable } from "./Spawnable.mjs";

export class EntitySpawner {
	private static spawnables: Spawnable[] = [];
	static register(spawnable: Spawnable) {
		EntitySpawner.spawnables.push(spawnable);
	}

	static randomizeEntities(numOptional: number = 2) {
		const optional = EntitySpawner.spawnables.filter(s => s.optional);
		const mandatory = EntitySpawner.spawnables.filter(s => !s.optional);
		return [...mandatory, ...RandomUtils.randomPermutation(optional).slice(0, numOptional)];
	}


	static spawnEntities(amount: number, evenness: number, tileRegion: Rectangle, requirements: ((position: Vector, world: World) => boolean)[], spawn: (position: Vector, world: World) => boolean, safeRegion: Rectangle, world: World) {
		const safePositions = new Set(safeRegion.squares().map(s => s.toString()));
		const positions = tileRegion.squares().filter(s => !safePositions.has(s.toString()));
		let possiblePositions = positions.filter(position => requirements.every(r => r(position, world)));
		const spawnedPositions: Vector[] = [];
		while(spawnedPositions.length < amount && possiblePositions.length > 0) {
			const [position] = RandomUtils.randomEvenlySpaced({
				generate: () => ArrayUtils.randomItem(possiblePositions),
				metric: Vector.dist,
				amount: 1,
				trials: evenness,
				previousPoints: spawnedPositions,
			});
			const spawned = spawn(position, world);
			if(spawned) {
				spawnedPositions.push(position);
			}
			const adjacent = [position, ...position.adjacentVectors()];
			possiblePositions = possiblePositions.filter(p => p !== position && !adjacent.some(a => a.equals(p)));
		}
	}


	static spawnRequirements = {
		replaceSolid: (position: Vector, world: World) => {
			const tile = world.tiles.get(position);
			return tile instanceof BasicTile;
		},
		replaceEmpty: (position: Vector, world: World) => world.tiles.get(position) === EmptyTile.EMPTY,
		solidAdjacent: (position: Vector, world: World) => Directions.DIRECTIONS.some(direction => {
			const tile = world.tiles.get(position.add(Vector.unit(direction)));
			return tile instanceof BasicTile;
		}),
		atLeast2Empty: (position: Vector, world: World) => (
			Directions.DIRECTIONS.filter(d => world.tiles.get(position.add(Vector.unit(d))) === EmptyTile.EMPTY).length >= 2
		),
		noAdjacentGates: (position: Vector, world: World) => (
			!position.adjacentVectors().some(v => Gate.isGateAt(v, world.entities))
		),
		atLeastLine3Empty: (position: Vector, world: World) => {
			for(const direction of Directions.DIRECTIONS) {
				const firstTile = world.tiles.get(position.add(Vector.unit(direction)));
				if(firstTile instanceof BasicTile) { continue; }
				for(let i = 2; i <= 3; i ++) {
					if(world.tiles.get(position.add(Vector.unit(direction).multiply(i))) !== EmptyTile.EMPTY) {
						return false;
					}
				}
			}
			return true;
		},
		atLeast3RectEmpty: (position: Vector, world: World) => {
			for(const direction of Directions.DIRECTIONS) {
				const directionVector = Vector.unit(direction);
				const perpendicular1 = Vector.unit(Directions.rotateClockwise[direction]);
				const perpendicular2 = Vector.unit(Directions.rotateCounterclockwise[direction]);
				const firstTile = world.tiles.get(position.add(directionVector));
				if(firstTile instanceof BasicTile) { continue; }
				for(let i = 2; i <= 3; i ++) {
					if(
						world.tiles.get(position.add(directionVector.multiply(i))) !== EmptyTile.EMPTY ||
						world.tiles.get(position.add(directionVector.multiply(i)).add(perpendicular1)) !== EmptyTile.EMPTY ||
						world.tiles.get(position.add(directionVector.multiply(i)).add(perpendicular2)) !== EmptyTile.EMPTY
					) {
						return false;
					}
				}
			}
			return true;
		},
		notOnFloor: (position: Vector, world: World) => {
			return world.tiles.get(position.add(0, -1)) !== EmptyTile.EMPTY;
		},
		leftOrRightEmpty: (position: Vector, world: World) => (
			world.tiles.get(position.add(-1, 0)) === EmptyTile.EMPTY ||
			world.tiles.get(position.add(1, 0)) === EmptyTile.EMPTY
		),
		solidBelow: (position: Vector, world: World) => world.tiles.get(position.add(0, 1)) instanceof BasicTile,
		notOnPortal: (position: Vector, world: World) => {
			const tileSquare = Tiles.getTileSquare(position);
			const entities = [...world.entities.possiblyIntersecting(tileSquare)];
			return !entities.some(e => e instanceof Portal && e.boundingBox().intersects(tileSquare));
		},
	};
}
