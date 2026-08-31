import { Tile } from "./Tile.mjs";

export class EmptyTile extends Tile {
	private constructor() {
		super();
	}
	static readonly EMPTY = new EmptyTile();

	render() { return []; }
	display() { }

	reflect(): EmptyTile {
		return this;
	}
	angularMotionBlockers() {
		return [];
	}
	intersects() {
		return false;
	}
	rayIntersectionDistance(): number {
		return Infinity;
	}
	blocksMovement() {
		return false;
	}
	rectIntersectionDistance() {
		return Infinity;
	}
	corners() {
		return [];
	}
}
