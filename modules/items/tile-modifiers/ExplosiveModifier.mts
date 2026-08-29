import { Explosion } from "../../game-utilities/Explosion.mjs";
import { ThrowableTileEntity } from "../ThrowableTileEntity.mjs";
import { TileModifier } from "../TileModifier.mjs";

export class ExplosiveModifier extends TileModifier {
	onCollision(tile: ThrowableTileEntity): void {
		const explosion = new Explosion(tile.hitbox.center());
		explosion.explode(tile.world);
	}

	displayIcon(): void {
		// TODO
	}

	reset() { }
}
