import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { World } from "../world/World.mjs";

export abstract class FixedEntitySpawner {
	abstract spawn(tileOffset: Vector, world: World): void;

	abstract reflect(): FixedEntitySpawner;
}
