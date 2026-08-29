import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { WorldUIData } from "../constants/GameData.mjs";
import { ThrowableTile } from "../items/ThrowableTile.mjs";
import { World } from "../world/World.mjs";

export class WorldUI {
	display(world: World, canvasIO: CanvasIO) {
		this.displayHealth(world.player.health, canvasIO);
		this.displayItems(world.player.equippedItems, canvasIO, world);
	}

	displayHealth(amount: number, canvasIO: CanvasIO) {
		const center = new Vector(
			WorldUIData.HEALTH_BOX_MARGIN + WorldUIData.HEALTH_BOX_SIZE / 2,
			WorldUIData.HEALTH_BOX_MARGIN + WorldUIData.HEALTH_BOX_SIZE / 2,
		);
		canvasIO.ctx.fillStyle = WorldUIData.HEALTH_COLOR;
		canvasIO.fillRegularPoly(center, WorldUIData.HEALTH_BOX_SIZE / 2, 6, 0);

		canvasIO.ctx.fillStyle = "black";
		canvasIO.ctx.font = WorldUIData.HEALTH_TEXT_FONT;
		canvasIO.ctx.textAlign = "center";
		canvasIO.ctx.textBaseline = "middle";
		canvasIO.ctx.fillText(amount.toString(), center.x, center.y);
	}

	displayItems(items: (ThrowableTile | null)[], canvasIO: CanvasIO, world: World) {
		for(const [index, item] of items.entries()) {
			const x = WorldUIData.HEALTH_BOX_MARGIN + WorldUIData.HEALTH_BOX_SIZE + WorldUIData.ITEM_BOX_MARGIN * (index + 1) + WorldUIData.ITEM_BOX_SIZE * index;
			const y = WorldUIData.HEALTH_BOX_MARGIN;
			canvasIO.ctx.fillStyle = WorldUIData.ITEM_BOX_COLOR;
			canvasIO.fillSquare(x, y, WorldUIData.ITEM_BOX_SIZE);

			if(item) {
				const rect = Rectangle.fromDimensions(x, y, WorldUIData.ITEM_BOX_SIZE, WorldUIData.ITEM_BOX_SIZE);
				item.displayIcon(canvasIO, rect, world);
			}
		}
	}
}
