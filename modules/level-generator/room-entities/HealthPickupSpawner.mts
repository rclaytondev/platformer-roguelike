import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { RoomData } from "../../constants/GameData.mjs";
import { HealthPickup } from "../../entities/HealthPickup.mjs";
import { World } from "../../world/World.mjs";
import { FixedEntitySpawner } from "../FixedEntitySpawner.mjs";

export class HealthPickupSpawner extends FixedEntitySpawner {
	readonly tilePos: Vector;
	constructor(tilePos: Vector) {
		super();
		this.tilePos = tilePos;
	}

	spawn(tileOffset: Vector, world: World): void {
		world.entities.add(new HealthPickup(this.tilePos.add(tileOffset), world));
	}

	reflect(): FixedEntitySpawner {
		return new HealthPickupSpawner(new Vector(
			RoomData.SIZE - this.tilePos.x - 1,
			this.tilePos.y,
		));
	}
}
