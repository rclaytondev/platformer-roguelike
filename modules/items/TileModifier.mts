import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { World } from "../world/World.mjs";
import { ThrowableTileEntity } from "./ThrowableTileEntity.mjs";

export abstract class TileModifier {
	gravity: "normal" | "none" | "reverse" = "normal";
	frictionY: number | null = 1;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	update(tile: ThrowableTileEntity, world: World, canvasIO: CanvasIO) { }
	abstract displayIcon(canvasIO: CanvasIO, world: World): void;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onCollision(tile: ThrowableTileEntity, collision: CollisionEvent) { }
	abstract reset(): void;
}
