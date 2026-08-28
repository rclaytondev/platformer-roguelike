import { Direction, Directions } from "../../../utils-ts/modules/geometry/Direction.mjs";
import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { RoomData } from "../../constants/GameData.mjs";
import { Gate } from "../../entities/Gate.mjs";
import { World } from "../../world/World.mjs";
import { FixedEntitySpawner } from "../FixedEntitySpawner.mjs";

export class GateSpawner extends FixedEntitySpawner {
	readonly tilePos: Vector;
	readonly direction: Direction;
	readonly toggled: boolean;

	constructor(tilePos: Vector, direction: Direction, toggled: boolean) {
		super();
		this.tilePos = tilePos;
		this.direction = direction;
		this.toggled = toggled;
	}

	spawn(tileOffset: Vector, world: World): void {
		world.entities.add(Gate.atTile(this.tilePos.add(tileOffset), this.direction, this.toggled));
	}

	reflect(): GateSpawner {
		return new GateSpawner(
			new Vector(RoomData.SIZE - this.tilePos.x - 1, this.tilePos.y),
			Directions.reflectX[this.direction],
			this.toggled,
		);
	}
}
