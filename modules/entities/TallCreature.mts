import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { TallCreatureData } from "../constants/GameData.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { InvisibleRectangle } from "../game-utilities/physics-engine/InvisibleRectangle.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { World } from "../world/World.mjs";

class TallCreatureLeg {
	position: Vector;
	attachmentX: number;
	offsetX: number;
	offsetDirection: -1 | 1;
	constructor(position: Vector, attachmentX: number, offsetX: number, offsetDirection: 1 | -1) {
		this.position = position;
		this.attachmentX = attachmentX;
		this.offsetX = offsetX;
		this.offsetDirection = offsetDirection;
	}
	static initialize(tallCreature: TallCreature, attachmentX: number, offsetDirection: 1 | -1, world: World) {
		const result = new TallCreatureLeg(new Vector(0, 0), attachmentX, 0, offsetDirection);
		result.position = result.destination(tallCreature, world);
		return result;
	}

	attachmentPoint(tallCreature: TallCreature) {
		return tallCreature.head.edgeCenter("down").add(new Vector(this.attachmentX, 0));
	}
	destination(tallCreature: TallCreature, world: World) {
		const attachmentPoint = this.attachmentPoint(tallCreature);
		const distance = world.lineIntersectionDistance(
			attachmentPoint,
			Vector.unit("down"),
			TallCreatureData.MAX_LEG_HEIGHT,
			[],
			(e) => e !== tallCreature,
		);
		return attachmentPoint.add(this.offsetX, distance);
	}
	update(tallCreature: TallCreature, world: World) {
		this.updatePosition(tallCreature, world);
		this.updateOffset();
	}
	updatePosition(tallCreature: TallCreature, world: World) {
		const destination = this.destination(tallCreature, world);
		this.position = GeomUtils.moveVectorTowards(this.position, destination, TallCreatureData.LEG_UPDATE_SPEED);
	}
	updateOffset() {
		this.offsetX += this.offsetDirection * TallCreatureData.LEG_SPEED;
		if(this.offsetX > TallCreatureData.MAX_LEG_OFFSET) {
			this.offsetDirection = -1;
		}
		else if(this.offsetX < -TallCreatureData.MAX_LEG_OFFSET) {
			this.offsetDirection = 1;
		}
	}

	display(tallCreature: TallCreature, canvasIO: CanvasIO) {
		const attachmentPoint = this.attachmentPoint(tallCreature);
		canvasIO.ctx.strokeStyle = "black";
		canvasIO.ctx.lineWidth = TallCreatureData.LEG_LINE_WIDTH;
		canvasIO.strokeLine(attachmentPoint.x, attachmentPoint.y, this.position.x, this.position.y);
	}
}

class TallCreatureStabber {
	direction: "left" | "right";
	extension: number = 0;
	mode: "stabbing" | "retracting" = "retracting";

	constructor(direction: "left" | "right") {
		this.direction = direction;
	}

	update(tallCreature: TallCreature, world: World, canvasIO: CanvasIO) {
		if(this.mode === "retracting") {
			this.setExtension(this.extension - TallCreatureData.RETRACTING_SPEED, tallCreature, world, canvasIO);
			if(this.extension === 0) {
				this.checkStabbing(tallCreature, world);
			}
		}
		if(this.mode === "stabbing") {
			this.setExtension(this.extension + TallCreatureData.STABBING_SPEED, tallCreature, world, canvasIO);
		}
	}
	checkStabbing(tallCreature: TallCreature, world: World) {
		const yIntersects = (
			world.player.hitbox.bottom > tallCreature.head.top &&
			world.player.hitbox.top < tallCreature.head.bottom
		);
		if(!yIntersects) { return; }

		const distance = (
			this.direction === "left"
			? tallCreature.head.left - world.player.hitbox.right
			: world.player.hitbox.left - tallCreature.head.right
		);
		if(distance < 0) { return; }

		const obstruction = world.rectIntersectionDistance(tallCreature.head, this.direction, distance, o => o !== tallCreature);
		if(distance <= obstruction) {
			this.beginStabbing();
		}
	}
	beginStabbing() {
		this.mode = "stabbing";
	}
	beginRetracting() {
		this.mode = "retracting";
	}
	hitbox(tallCreature: TallCreature) {
		return tallCreature.head.extend(this.direction, this.extension).extend(Directions.opposite[this.direction], -tallCreature.head.width);
	}
	setExtension(amount: number, tallCreature: TallCreature, world: World, canvasIO: CanvasIO) {
		const rect = new InvisibleRectangle(this.hitbox(tallCreature), world);
		if(amount <= this.extension) {
			for(let i = 0; i < this.extension - amount; i ++) {
				rect.moveRiders(Directions.opposite[this.direction], world, {
					canMoveRider: (o) => o !== tallCreature,
					movedObjects: new Set(),
				});
			}
			this.extension = Math.max(0, amount);
		}
		else {
			rect.extend(amount - rect.hitbox.width, this.direction, world, canvasIO, {
				collides: (o) => o !== tallCreature,
				canMoveRider: (o) => o !== tallCreature,
				onCollision: (collisionEvent: CollisionEvent) => {
					const collidingObject = collisionEvent.collidingObject(rect);
					if(collidingObject instanceof Collideable) {
						collidingObject.damage(rect.hitbox.translate(Vector.unit(this.direction)));
					}
					this.beginRetracting();
				},
			});
			this.extension = rect.hitbox.width;
		}
		world.entities.updatePosition(tallCreature);
	}

	isMoving() {
		return this.mode === "stabbing" || this.extension !== 0;
	}
}

export class TallCreature extends Collideable {
	head: Rectangle;
	legHeight: number;
	direction: "left" | "right" = "left";
	legs: TallCreatureLeg[];

	stabberLeft = new TallCreatureStabber("left");
	stabberRight = new TallCreatureStabber("right");

	constructor(position: Vector, legHeight: number, world: World) {
		super(world);
		const rect = Rectangle.fromCenter(position.x, position.y, TallCreatureData.HEAD_WIDTH, TallCreatureData.HEAD_HEIGHT);
		this.head = Rectangle.fromDimensions(Math.floor(rect.x), Math.floor(rect.y), Math.floor(rect.width), Math.floor(rect.height));
		this.subpixel = rect.getCorner("top-left").subtract(rect.getCorner("top-left").floor());
		this.legHeight = legHeight;
		this.legs = TallCreatureData.LEG_ATTACHMENTS.map((o, i) => TallCreatureLeg.initialize(this, o, i % 2 === 0 ? 1 : -1, world ?? this.world));
	}

	render() {
		return [
			new Renderable((c) => this.display(c), "entity"),
			new Renderable((c) => this.displayGlowEffect(c), "glow"),
		];
	}
	display(canvasIO: CanvasIO) {
		this.displayHead(canvasIO);
		this.displayEyes(canvasIO);
		this.displayLegs(canvasIO);
	}
	displayHead(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = "black";
		canvasIO.fillRect(this.head);
	}
	displayEyes(canvasIO: CanvasIO) {
		const center = this.head.center();
		canvasIO.ctx.fillStyle = GraphicsUtils.formatColor(TallCreatureData.EYE_COLOR);
		canvasIO.fillDiamond(center.x, center.y, TallCreatureData.EYE_RADIUS);
		canvasIO.fillDiamond(center.x + TallCreatureData.EYE_SPACING, center.y, TallCreatureData.EYE_RADIUS);
		canvasIO.fillDiamond(center.x - TallCreatureData.EYE_SPACING, center.y, TallCreatureData.EYE_RADIUS);
	}
	displayLegs(canvasIO: CanvasIO) {
		for(const leg of this.legs) {
			leg.display(this, canvasIO);
		}
	}
	displayGlowEffect(canvasIO: CanvasIO): void {
		const center = this.head.center();
		GraphicsUtils.glowCircle(
			center.x, center.y,
			TallCreatureData.GLOW_SIZE, TallCreatureData.GLOW_INTENSITY, canvasIO,
			TallCreatureData.EYE_COLOR.red, TallCreatureData.EYE_COLOR.green, TallCreatureData.EYE_COLOR.blue,
		);
	}

	update(canvasIO: CanvasIO) {
		if(!this.stabberLeft.isMoving() && !this.stabberRight.isMoving()) {
			this.updateMovement();
			this.updateLegs();
		}
		this.stabberLeft.update(this, this.world, canvasIO);
		this.stabberRight.update(this, this.world, canvasIO);
	}
	updateMovement() {
		const onGroundBefore = !this.canMove("down", this.world);
		this.move(Vector.unit(this.direction).multiply(TallCreatureData.SPEED), this.world, {});
		const onGroundAfter = !this.canMove("down", this.world);
		if(onGroundBefore && !onGroundAfter) {
			const stepHeight = this.world.rectIntersectionDistance(this.legsHitbox(), "down", TallCreatureData.MAX_STEP_SIZE, (e) => e !== this);
			if(stepHeight < TallCreatureData.MAX_STEP_SIZE) {
				this.legHeight += stepHeight;
			}
		}


		this.world.entities.updatePosition(this);
	}
	updateLegs() {
		for(const leg of this.legs) {
			leg.update(this, this.world);
		}
	}
	onCollision(collision: CollisionEvent) {
		if(collision.directionOf(this) === this.direction) {
			this.direction = Directions.opposite[this.direction];
		}
	}

	legsHitbox() {
		const center = this.head.x + this.head.width / 2;
		return Rectangle.fromDimensions(
			center - TallCreatureData.LEG_HITBOX_WIDTH / 2, this.head.bottom,
			TallCreatureData.LEG_HITBOX_WIDTH, this.legHeight,
		);
	}
	hitboxes(): Rectangle[] {
		return [
			this.head,
			this.legsHitbox(),
			this.stabberLeft.hitbox(this),
			this.stabberRight.hitbox(this),
		];
	}
	boundingBox(): Rectangle {
		return Rectangle.boundingBox(this.hitboxes().flatMap(
			r => [r.getCorner("top-left"), r.getCorner("top-right"), r.getCorner("bottom-left"), r.getCorner("bottom-right")],
		));
	}
	translate(amount: Vector): void {
		this.head = this.head.translate(amount);
	}
}
