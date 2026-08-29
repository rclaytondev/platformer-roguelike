import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { RoomData, WorldData } from "../../constants/GameData.mjs";
import { Portal } from "../../entities/Portal.mjs";
import { World } from "../../world/World.mjs";
import { FixedEntitySpawner } from "../FixedEntitySpawner.mjs";

export class PortalSpawner extends FixedEntitySpawner {
	readonly position: Vector;
	constructor(position: Vector) {
		super();
		this.position = position;
	}

	spawn(tilePos: Vector, world: World): void {
		world.entities.add(new Portal(this.position.add(tilePos.multiply(WorldData.TILE_SIZE)), world));
	}

	reflect() {
		return new PortalSpawner(new Vector(RoomData.SIZE * WorldData.TILE_SIZE - this.position.x, this.position.y));
	}
}
