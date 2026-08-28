import { Vector } from "../../../utils-ts/modules/geometry/Vector.mjs";
import { RoomData } from "../../constants/GameData.mjs";
import { Chain } from "../../entities/Chain.mjs";
import { World } from "../../world/World.mjs";
import { FixedEntitySpawner } from "../FixedEntitySpawner.mjs";

export class ChainSpawner extends FixedEntitySpawner {
	readonly tilePos: Vector;
	height: number;
	constructor(tilePos: Vector, height: number) {
		super();
		this.tilePos = tilePos;
		this.height = height;
	}

	spawn(tileOffset: Vector, world: World): void {
		world.entities.add(new Chain(this.tilePos.add(tileOffset), this.height));
	}

	reflect() {
		return new ChainSpawner(
			new Vector(RoomData.SIZE - this.tilePos.x - 1, this.tilePos.y),
			this.height,
		);
	}
}
