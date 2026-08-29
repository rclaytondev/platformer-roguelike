import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { RoomData, WorldData } from "../../constants/GameData.mjs";
import { SpawnPoint } from "../../entities/SpawnPoint.mjs";
import { World } from "../../world/World.mjs";
import { FixedEntitySpawner } from "../FixedEntitySpawner.mjs";

export class SpawnPointSpawner extends FixedEntitySpawner {
	readonly position: Vector;
	constructor(position: Vector) {
		super();
		this.position = position;
	}

	spawn(position: Vector, world: World): void {
		world.entities.add(new SpawnPoint(this.position.add(position.multiply(WorldData.TILE_SIZE)), world));
	}

	reflect(): FixedEntitySpawner {
		return new SpawnPointSpawner(new Vector(
			RoomData.SIZE * WorldData.TILE_SIZE - this.position.x - WorldData.TILE_SIZE,
			this.position.y,
		));
	}
}
