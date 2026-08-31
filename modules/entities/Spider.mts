import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Diagonal, Direction, Directions } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { HashSet } from "../../utils-ts/modules/HashSet.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";
import { LoadingManager } from "../app-entry-points/LoadingManager.mjs";
import { DEBUG_SETTINGS } from "../constants/DebugSettings.mjs";
import { PlayerData, RoomData, SpiderData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { CollisionEvent } from "../game-utilities/physics-engine/CollisionEvent.mjs";
import { RectangularCollideable } from "../game-utilities/physics-engine/RectangularCollideable.mjs";
import { EntitySpawner } from "../level-generator/EntitySpawner.mjs";
import { Spawnable } from "../level-generator/Spawnable.mjs";
import { BasicTile } from "../tiles/BasicTile.mjs";
import { Renderable } from "../world/Renderer.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { TileWithPosition, World } from "../world/World.mjs";
import { Fireball } from "./Fireball.mjs";

export class PointOnSurface {
	readonly normal: Direction | Diagonal;
	readonly position: Vector;
	constructor(point: Vector, normal: Direction | Diagonal) {
		this.position = point;
		this.normal = normal;
	}

	move1Pixel(self: Collideable | null, world: World, direction: "clockwise" | "counterclockwise") {
		const blockers = world.angularMotionBlockers(this.position, direction, (e) => e !== self);
		if(blockers.length === 0) {
			const opposite = (direction === "clockwise" ? "counterclockwise" : "clockwise");
			const onPlatformEnd = world.angularMotionBlockers(this.position, opposite, e => e !== self).length !== 0;
			return onPlatformEnd ? "on-platform-end" : "floating";
		}
		const newTangent = Directions.nextIn(blockers, this.normal, direction);
		const newNormal = (direction === "clockwise") ? Directions.rotateCounterclockwise[newTangent] : Directions.rotateClockwise[newTangent];
		return new PointOnSurface(this.position.add(Vector.gridUnit(newTangent)), newNormal);
	}

	nextCornerSearchRegion(maxDistance: number, angularDirection: "clockwise" | "counterclockwise") {
		const direction = this.tangentVector(angularDirection);
		const endpoint = this.position.add(Vector.unit(direction).multiply(maxDistance));
		const thinSearchRegion = Rectangle.fromOppositeCorners(this.position, endpoint);
		return thinSearchRegion.extend("all", 2);
	}
	nextPossibleCorner(maxDistance: number, angularDirection: "clockwise" | "counterclockwise", world: World) {
		const searchRegion = this.nextCornerSearchRegion(maxDistance, angularDirection);
		const entities = [...world.entities.collideablesIntersecting(searchRegion)];
		const entityCorners = entities.flatMap(e => e.corners());
		const tiles = [...world.tiles.getTilesAt(searchRegion)];
		const overlaps = World.intersectingSolids(tiles, entities);
		if(overlaps.length !== 0) {
			return 0;
		}
		const tileCorners = tiles.flatMap(({ position, tile }) => tile.corners(position));
		const corners = new HashSet([...entityCorners, ...tileCorners]);
		const direction = this.tangentVector(angularDirection);
		const searchVector = Vector.gridUnit(direction);
		const hitboxes = entities.flatMap(e => e.hitboxes());
		const cornerDistances = [...corners].map(c => GeomUtils.rayIntersectsPoint(this.position, searchVector, c));
		const entityDistances = hitboxes.map(h => GeomUtils.rayIntersectsRectangle(this.position, searchVector, h.extend("all", -1)) - 1);
		return Math.max(0, Math.min(maxDistance, ...cornerDistances, ...entityDistances));
	}
	move(self: Collideable | null, world: World, direction: "clockwise" | "counterclockwise", max: number, stopAfterTurn: boolean = true): [number, PointOnSurface] {
		let totalDistance = 0;
		const currentDirection = direction;
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let currentPoint: PointOnSurface = this;
		while(true) {
			const distanceToTurn = currentPoint.nextPossibleCorner(max, currentDirection, world);
			const nextPoint = currentPoint.position.add(Vector.gridUnit(currentPoint.tangentVector(currentDirection)).multiply(distanceToTurn));
			const next = new PointOnSurface(nextPoint, currentPoint.normal);
			const afterTurn = next.move1Pixel(self, world, currentDirection);
			if(totalDistance + distanceToTurn > max) {
				return [
					max,
					new PointOnSurface(
						currentPoint.position.add(Vector.gridUnit(currentPoint.tangentVector(currentDirection)).multiply(max - totalDistance)),
						currentPoint.normal,
					),
				];
			}
			if(!(afterTurn instanceof PointOnSurface)) {
				return [totalDistance + distanceToTurn, next];
			}
			totalDistance += distanceToTurn + 1;
			if(stopAfterTurn && totalDistance <= max && afterTurn.normal !== currentPoint.normal) {
				return [
					totalDistance - 1,
					afterTurn,
				];
			}
			currentPoint = afterTurn;
		}
	}




	tangentVector(direction: "clockwise" | "counterclockwise") {
		return Directions.rotate[direction][this.normal];
	}

	equals(pointOnSurface: PointOnSurface) {
		return this.normal === pointOnSurface.normal && this.position.equals(pointOnSurface.position);
	}
}

class Turn {
	distance: number;
	point: PointOnSurface;

	constructor(distance: number, point: PointOnSurface) {
		this.distance = distance;
		this.point = point;
	}
}

class SpiderHitboxCalculator {
	normal: Direction | Diagonal;
	previousTurn: Turn;
	nextTurn: Turn;

	constructor(normal: Direction | Diagonal, previousTurn: Turn, nextTurn: Turn) {
		this.normal = normal;
		this.previousTurn = previousTurn;
		this.nextTurn = nextTurn;
	}

	wallDistance() {
		const distanceToTurn = Math.min(this.nextTurn.distance, this.previousTurn.distance);
		if(distanceToTurn >= SpiderData.TURN_WALL_DURATION) {
			return SpiderData.SIZE / 2;
		}
		return SpiderData.SIZE / 2 + GeomUtils.lerp(
			distanceToTurn,
			0, SpiderData.TURN_WALL_DURATION,
			SpiderData.TURN_WALL_DISTANCE, 0,
		);
	}
	smoothedNormalAngle() {
		if(this.previousTurn.distance === 0 && this.nextTurn.distance === 0) {
			/* This is an edge case that can happen when moving past a platform from below. */
			const previousAngle = Directions.angle[this.previousTurn.point.normal];
			const nextAngle = Directions.angle[this.nextTurn.point.normal];
			return GeomUtils.lerpAngle(1/2, 0, 1, previousAngle, nextAngle);
		}
		else if(this.previousTurn.distance + this.nextTurn.distance < 2 * SpiderData.TURN_WALL_DURATION) {
			const halfAngle1 = GeomUtils.lerpAngle(1/2, 0, 1, Directions.angle[this.previousTurn.point.normal], Directions.angle[this.normal]);
			const halfAngle2 = GeomUtils.lerpAngle(1/2, 0, 1, Directions.angle[this.normal], Directions.angle[this.nextTurn.point.normal]);
			return GeomUtils.lerpAngle(
				this.previousTurn.distance,
				0, this.previousTurn.distance + this.nextTurn.distance,
				halfAngle1, halfAngle2,
			);
		}
		else if(this.previousTurn.distance < SpiderData.TURN_WALL_DURATION) {
			const halfAngle = GeomUtils.lerpAngle(
				1/2, 0, 1,
				Directions.angle[this.normal], Directions.angle[this.previousTurn.point.normal],
			);
			return GeomUtils.lerpAngle(
				this.previousTurn.distance,
				0, SpiderData.TURN_WALL_DURATION,
				halfAngle, Directions.angle[this.normal],
			);
		}
		else if(this.nextTurn.distance < SpiderData.TURN_WALL_DURATION) {
			const halfAngle = GeomUtils.lerpAngle(
				1/2, 0, 1,
				Directions.angle[this.normal], Directions.angle[this.nextTurn.point.normal],
			);
			const result = GeomUtils.lerpAngle(
				this.nextTurn.distance,
				0, SpiderData.TURN_WALL_DURATION,
				halfAngle, Directions.angle[this.normal],
			);
			return result;
		}
		else {
			return Directions.angle[this.normal];
		}
	}
	scaledSmoothedNormal(angle: number = this.smoothedNormalAngle()) {
		const wallDistance = this.wallDistance();
		return new Vector(Math.cos(angle), -Math.sin(angle)).multiply(wallDistance);
	}
}

export class CrawlingState {
	pointOnSurface: PointOnSurface;
	direction: "clockwise" | "counterclockwise";
	subpixel: number = 0;

	constructor(pointOnSurface: PointOnSurface, direction: "clockwise" | "counterclockwise") {
		this.pointOnSurface = pointOnSurface;
		this.direction = direction;
	}

	update(spider: Spider) {
		if(this.isFloating(spider) || this.isBasepointDetached(spider)) {
			spider.beginFalling();
			return;
		}
		this.move(spider);
		spider.projectileState.update(spider);
	}
	move(spider: Spider) {
		this.subpixel += spider.projectileState.speed;
		let amountMoved = 0;
		while(this.subpixel >= 1) {
			amountMoved ++;
			const moved = this.move1Pixel(spider);
			if(moved && amountMoved % SpiderData.MAX_DISTANCE_PER_MOVE === 0 && this.subpixel >= 1) {
				this.updateHitbox(spider);
			}
		}
		const [normal, angle] = this.getNormalAndAngle(spider);
		this.updateHitbox(spider, normal);
		spider.angle = GeomUtils.moveAngleTowards(spider.angle, angle, SpiderData.ANGULAR_SPEED);
	}
	move1Pixel(spider: Spider) {
		const nextPoint = this.pointOnSurface.move1Pixel(spider, spider.world, this.direction);
		this.subpixel --;
		if(nextPoint === "on-platform-end" || nextPoint === "floating") {
			this.direction = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
			return false;
		}
		this.pointOnSurface = nextPoint;
		return true;
	}
	hitboxCalculator(spider: Spider) {
		const opposite = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
		const [nextTurnDistance, nextTurn] = this.pointOnSurface.move(spider, spider.world, this.direction, 2 * SpiderData.TURN_WALL_DURATION);
		const [previousTurnDistance, previousTurn] = this.pointOnSurface.move(spider, spider.world, opposite, 2 * SpiderData.TURN_WALL_DURATION);
		return new SpiderHitboxCalculator(
			this.pointOnSurface.normal,
			new Turn(previousTurnDistance, previousTurn),
			new Turn(nextTurnDistance, nextTurn),
		);
	}
	getNormalAndAngle(spider: Spider): [Vector, number] {
		const hitboxCalculator = this.hitboxCalculator(spider);
		const angle = hitboxCalculator.smoothedNormalAngle();
		const normal = hitboxCalculator.scaledSmoothedNormal(angle);
		return [normal, angle];
	}
	updateHitbox(spider: Spider, normal?: Vector) {
		normal ??= this.getNormalAndAngle(spider)[0];
		const preferredCenter = this.pointOnSurface.position.add(normal);
		const offset = preferredCenter.subtract(spider.hitbox.center().add(spider.subpixel));
		const collides = (obj: Collideable | TileWithPosition) => !(obj instanceof Fireball && obj.ignoredEntities.includes(spider));
		spider.move(offset, spider.world, { collides });
	}
	isFloating(spider: Spider) {
		const opposite = this.direction === "clockwise" ? "counterclockwise" : "clockwise";
		const blockers1 = spider.world.angularMotionBlockers(this.pointOnSurface.position, this.direction, (o) => o !== spider);
		const blockers2 = spider.world.angularMotionBlockers(this.pointOnSurface.position, opposite, (o) => o !== spider);
		return blockers1.length === 0 && blockers2.length === 0;
	}
	isBasepointDetached(spider: Spider) {
		const distance = Vector.dist(spider.hitbox.center(), this.pointOnSurface.position);
		return (distance > SpiderData.MAX_BASEPOINT_DISTANCE);
	}

	runAway(point: Vector) {
		const distance = Vector.dist(this.pointOnSurface.position, point);
		const direction = this.pointOnSurface.tangentVector(this.direction);
		const nextDistance = Vector.dist(this.pointOnSurface.position.add(Vector.unit(direction)), point);
		if(nextDistance < distance) {
			this.direction = (this.direction === "clockwise" ? "counterclockwise" : "clockwise");
		}
	}
}

export class SpiderLeg {
	minDistance: number;
	maxDistance: number;
	distance: number;
	destinationDistance: number;
	attachmentOffset: Vector;
	length: number;
	position: Vector = new Vector(0, 0);

	constructor(length: number, attachmentOffset: Vector, minDistance: number, maxDistance: number) {
		this.length = length;
		this.attachmentOffset = attachmentOffset;
		this.distance = minDistance;
		this.destinationDistance = maxDistance;
		this.minDistance = minDistance;
		this.maxDistance = maxDistance;
	}

	update(spider: Spider) {
		if(Math.abs(this.distance) <= this.minDistance || Math.sign(this.distance) !== Math.sign(this.attachmentOffset.x)) {
			this.destinationDistance = this.maxDistance * Math.sign(this.attachmentOffset.x);
		}
		else if(Math.abs(this.distance) >= this.maxDistance && Math.sign(this.distance) === Math.sign(this.attachmentOffset.x)) {
			this.destinationDistance = this.minDistance * Math.sign(this.attachmentOffset.x);
		}

		if(!(spider.projectileState instanceof TelegraphState)) {
			this.distance = GeomUtils.moveTowards(this.distance, this.destinationDistance, SpiderData.LEG_SPEED);
		}

		const destination = this.destination(spider);
		const updateSpeed = spider.projectileState.speed + SpiderData.LEG_UPDATE_SPEED;
		this.position = GeomUtils.moveVectorTowards(this.position, destination, updateSpeed);
	}
	destination(spider: Spider) {
		if(spider.movement instanceof FallingState || spider.movement.isFloating(spider)) {
			return this.position;
		}
		const direction = this.distance > 0 ? "clockwise" : "counterclockwise";
		const [distance, point] = spider.movement.pointOnSurface.move(spider, spider.world, direction, Math.abs(this.distance), false);
		return point.position;
	}
	jointPosition(spider: Spider, position: Vector) {
		const center = spider.hitbox.center();
		const distance = Vector.dist(position, center);
		const horizontal = position.subtract(center).normalize();
		const up = horizontal.rotate(this.attachmentOffset.x < 0 ? 90 : -90);
		const height = Math.sqrt(Math.max(0, this.length ** 2 - (distance / 2) ** 2));
		return center.add(horizontal.multiply(distance / 2)).add(up.multiply(height));
	}

	display(spider: Spider, canvasIO: CanvasIO) {
		const attachment = this.attachment(spider);
		const joint = this.jointPosition(spider, this.position);
		canvasIO.ctx.strokeStyle = "black";
		canvasIO.ctx.lineWidth = 5;
		canvasIO.linePointedness = 2;
		canvasIO.pointedLine(attachment.x, attachment.y, joint.x, joint.y);
		canvasIO.pointedLine(joint.x, joint.y, this.position.x, this.position.y);
	}

	attachment(spider: Spider) {
		const center = spider.hitbox.center();
		return center.add(this.attachmentOffset.rotate(-MathUtils.toDegrees(spider.angle) + 90));
	}
}

export class FallingState {
	velocity: Vector = new Vector(0, 0);

	update(spider: Spider) {
		spider.move(this.velocity, spider.world, { });
		this.velocity = this.velocity.add(0, PlayerData.GRAVITY);
	}
}

abstract class ProjectileState {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	render(spider: Spider): Renderable[] { return []; }
	abstract update(spider: Spider): void;

	abstract numGlowingEyes(): number;
	abstract readonly speed: number;
}

class TelegraphState extends ProjectileState {
	timerProgress: number = 0;
	speed = 0;

	update(spider: Spider) {
		if(spider.seesPlayer()) {
			this.timerProgress ++;
			if(spider.movement instanceof CrawlingState && SkitterState.shouldSkitter(spider, true)) {
				spider.projectileState = new SkitterState();
				spider.movement.runAway(spider.world.player.hitbox.center());
			}
			else if(this.timerProgress > SpiderData.SHOT_DELAY) {
				spider.shootProjectile();
				spider.projectileState = new RechargingState();
			}
		}
		else {
			spider.projectileState = new DefaultState();
		}
	}

	render(spider: Spider) {
		return [new Renderable(c => this.display(spider, c), "telegraph")];
	}
	display(spider: Spider, canvasIO: CanvasIO) {
		const center = spider.hitbox.center();
		const player = spider.world.player.hitbox.center();
		const timerProgress = MathUtils.constrain(this.timerProgress, 0, SpiderData.SHOT_DELAY);
		const opacity = GeomUtils.lerp(timerProgress, 0, SpiderData.SHOT_DELAY, 0, 1);
		const width = GeomUtils.lerp(timerProgress, 0, SpiderData.SHOT_DELAY, 30, 2);
		GraphicsUtils.glowOutline(
			center.x, center.y,
			player.x, player.y,
			width, opacity, canvasIO,
			255, 255, 255,
		);
	}

	numGlowingEyes() {
		return SpiderData.NUM_EYES;
	}
}

class SkitterState extends ProjectileState {
	speed = SpiderData.FAST_SPEED;

	update(spider: Spider): void {
		const distance = Vector.dist(spider.hitbox.center(), spider.world.player.hitbox.center());
		if(distance > SpiderData.SKITTER_END_DISTANCE || !spider.seesPlayer()) {
			spider.projectileState = new DefaultState();
		}
	}

	static shouldSkitter(spider: Spider, seesPlayer: boolean) {
		const distance = Vector.dist(spider.hitbox.center(), spider.world.player.hitbox.center());
		return seesPlayer && distance < SpiderData.SKITTER_START_DISTANCE;
	}

	numGlowingEyes(): number {
		return 3;
	}
}

class DefaultState extends ProjectileState {
	speed = SpiderData.SPEED;

	update(spider: Spider) {
		if(spider.seesPlayer() && spider.movement instanceof CrawlingState) {
			if(SkitterState.shouldSkitter(spider, true)) {
				const playerPos = spider.world.player.hitbox.center();
				spider.movement.runAway(playerPos);
				spider.projectileState = new SkitterState();
			}
			else if(spider.movement instanceof CrawlingState) {
				spider.projectileState = new TelegraphState();
			}
		}
	}

	numGlowingEyes() {
		return SpiderData.NUM_EYES;
	}
}

class RechargingState extends ProjectileState {
	speed = SpiderData.FAST_SPEED;
	rechargeProgress: number = 0;

	update(spider: Spider) {
		if(spider.seesPlayer()) {
			this.rechargeProgress = 0;
			if(spider.movement instanceof CrawlingState) {
				spider.movement.runAway(spider.world.player.hitbox.center());
			}
		}
		else {
			this.rechargeProgress ++;
		}

		if(this.rechargeProgress > SpiderData.RECHARGE_TIME) {
			spider.projectileState = new DefaultState();
		}
	}

	numGlowingEyes() {
		return Math.floor(GeomUtils.lerp(
			MathUtils.constrain(this.rechargeProgress, 0, SpiderData.RECHARGE_TIME),
			0, SpiderData.RECHARGE_TIME,
			0, SpiderData.NUM_EYES,
		));
	}
}


export class Spider extends RectangularCollideable {
	movement: CrawlingState | FallingState;
	projectileState: TelegraphState | DefaultState | RechargingState = new DefaultState();
	angle: number = 0;
	legs: SpiderLeg[] = [];

	constructor(position: Vector, movement: CrawlingState | FallingState, world: World) {
		super(Rectangle.square(position.x, position.y, SpiderData.HITBOX_SIZE), world);
		this.movement = movement;
		this.world = world;
		this.legs = this.initializeLegs();
	}
	initializeLegs() {
		const legs = [
			new SpiderLeg(
				SpiderData.LEG_1.LENGTH,
				SpiderData.LEG_1.ATTACHMENT.reflectX(),
				SpiderData.LEG_1.MIN_DISTANCE,
				SpiderData.LEG_1.MAX_DISTANCE,
			),
			new SpiderLeg(
				SpiderData.LEG_1.LENGTH,
				SpiderData.LEG_1.ATTACHMENT,
				SpiderData.LEG_1.MIN_DISTANCE,
				SpiderData.LEG_1.MAX_DISTANCE,
			),

			new SpiderLeg(
				SpiderData.LEG_2.LENGTH,
				SpiderData.LEG_2.ATTACHMENT.reflectX(),
				SpiderData.LEG_2.MIN_DISTANCE,
				SpiderData.LEG_2.MAX_DISTANCE,
			),
			new SpiderLeg(
				SpiderData.LEG_2.LENGTH,
				SpiderData.LEG_2.ATTACHMENT,
				SpiderData.LEG_2.MIN_DISTANCE,
				SpiderData.LEG_2.MAX_DISTANCE,
			),
		];
		for(const leg of legs) {
			leg.position = leg.destination(this);
		}
		return legs;
	}

	render() {
		return [
			new Renderable(c => this.display(c), "entity"),
			new Renderable(c => this.displayGlowEffect(c), "glow"),
			...this.projectileState.render(this),
		];
	}
	display(canvasIO: CanvasIO) {
		this.displayBody(canvasIO);
		this.displayEyes(canvasIO);
		this.displayLegs(canvasIO);
	}
	displayBody(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		const position = this.hitbox.center();
		canvasIO.ctx.translate(position.x, position.y);
		canvasIO.ctx.rotate(-this.angle);
		canvasIO.ctx.fillStyle = SpiderData.COLOR;
		if(this.seesPlayer() && DEBUG_SETTINGS.SPIDERS.VISUALIZE) {
			canvasIO.ctx.fillStyle = "green";
		}
		canvasIO.fillRegularPoly(new Vector(0, 0), SpiderData.SIZE / 2, 6);
		canvasIO.ctx.restore();
	}
	displayEyes(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		const numGlowing = this.projectileState.numGlowingEyes();
		let count = 0;
		for(let angle = 0; angle < 360; angle += 360 / SpiderData.NUM_EYES) {
			const position = new Vector(0, -SpiderData.EYE_DISTANCE).rotate(angle + 90 + MathUtils.toDegrees(-this.angle));
			canvasIO.ctx.fillStyle = (count < numGlowing) ? SpiderData.EYE_COLOR : SpiderData.UNLIT_EYE_COLOR;
			canvasIO.fillDiamond(center.x + position.x, center.y + position.y, SpiderData.EYE_SIZE);
			count ++;
		}
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		const glowIntensity = GeomUtils.lerp(
			this.projectileState.numGlowingEyes(),
			0, SpiderData.NUM_EYES,
			0, SpiderData.GLOW_INTENSITY,
		);
		GraphicsUtils.glowCircle(
			center.x, center.y,
			SpiderData.GLOW_SIZE, glowIntensity,
			canvasIO,
			SpiderData.GLOW_COLOR.red, SpiderData.GLOW_COLOR.green, SpiderData.GLOW_COLOR.blue,
		);
	}
	displayLegs(canvasIO: CanvasIO) {
		for(const leg of this.legs) {
			leg.display(this, canvasIO);
		}
	}
	displayDebug(canvasIO: CanvasIO): void {
		if(this.movement instanceof FallingState || this.movement.isFloating(this) || !DEBUG_SETTINGS.SPIDERS.VISUALIZE) { return; }
		const point = this.movement.pointOnSurface.position;
		const normalEndpoint = point.add(Vector.unit(this.movement.pointOnSurface.normal).multiply(20));
		canvasIO.ctx.strokeStyle = "red";
		canvasIO.ctx.lineWidth = 3;
		canvasIO.strokeLine(point.x, point.y, normalEndpoint.x, normalEndpoint.y);

		const [smoothedNormal] = this.movement.getNormalAndAngle(this);
		const smoothedEndpoint = point.add(smoothedNormal);
		canvasIO.ctx.strokeStyle = "green";
		canvasIO.ctx.lineWidth = 3;
		canvasIO.strokeLine(point.x, point.y, smoothedEndpoint.x, smoothedEndpoint.y);
	}

	update() {
		this.movement.update(this);
		for(const leg of this.legs) {
			leg.update(this);
		}
	}
	seesPlayer() {
		const center = this.hitbox.center();
		const player = this.world.player.hitbox;
		const up = new Vector(0, -1).rotate(MathUtils.toDegrees(-this.angle)).multiply(15);
		const collides = (obj: Entity) => obj !== this && obj !== this.world.player;
		return this.world.hasLineOfSight(center.add(up), player, collides) && this.world.hasLineOfSight(center.subtract(up), player, collides);

	}
	shootProjectile() {
		const center = this.hitbox.center();
		const player = this.world.player.hitbox.center();
		const direction = player.subtract(center).normalize();
		const velocity = direction.multiply(SpiderData.PROJECTILE_SPEED);
		const acceleration = direction.multiply(SpiderData.PROJECTILE_ACCELERATION);
		const projectile = new Fireball(center, velocity, acceleration, [this], this.world);
		this.world.entities.add(projectile);
	}


	beginCrawling() {
		const centerBottom = this.hitbox.edgeCenter("down");
		for(let distance = 0; distance <= SpiderData.HITBOX_SIZE / 2; distance ++) {
			for(const sign of [-1, 1]) {
				const collides = (o: Entity) => o !== this;
				const possibleBasepoint = new Vector(centerBottom.x + sign * distance, centerBottom.y);
				const motionBlockers = this.world.angularMotionBlockers(possibleBasepoint, "clockwise", collides);
				if(motionBlockers.some(d => ["up-left", "left", "down-left", "down-right", "right", "up-right"].includes(d))) {
					this.movement = new CrawlingState(
						new PointOnSurface(possibleBasepoint, "up"),
						"clockwise",
					);
					return true;
				}
			}
		}
		return false;
	}
	beginFalling() {
		this.movement = new FallingState();
	}

	static spawn(tilePosition: Vector, world: World): boolean {
		const direction = Directions.DIRECTIONS.find(dir => {
			const tile = world.tiles.get(tilePosition.add(Vector.unit(dir)));
			return tile instanceof BasicTile;
		});
		if(!direction) {
			return false;
		}

		const tileSquare = Tiles.getTileSquare(tilePosition);
		const pointOnSurface = new PointOnSurface(tileSquare.edgeCenter(direction), Directions.opposite[direction]);
		const movement = new CrawlingState(pointOnSurface, "clockwise");
		const position = tileSquare.center().subtract(SpiderData.HITBOX_SIZE / 2, SpiderData.HITBOX_SIZE / 2);
		const spider = new Spider(position, movement, world);
		return world.addEntityIfEmpty(spider);
	}

	onCollision(collision: CollisionEvent): void {
		if(collision.directionOf(this) === "down" && this.movement instanceof FallingState) {
			this.beginCrawling();
		}
		else if(this.movement instanceof CrawlingState) {
			const collisionDirection = Vector.unit(collision.directionOf(this));
			const tangent = Vector.unit(this.movement.pointOnSurface.tangentVector(this.movement.direction));
			const opposite = (this.movement.direction === "clockwise" ? "counterclockwise" : "clockwise");
			const oppositeTangent = Vector.unit(this.movement.pointOnSurface.tangentVector(opposite));
			if(Vector.dist(tangent, collisionDirection) < Vector.dist(oppositeTangent, collisionDirection)) {
				this.movement.direction = (this.movement.direction === "clockwise") ? "counterclockwise" : "clockwise";
			}
		}
	}

	translate(amount: Vector): void {
		super.translate(amount);
		if(this.movement instanceof FallingState) {
			for(const leg of this.legs) {
				leg.position = leg.position.add(amount);
			}
		}
	}

	boundingBox(): Rectangle {
		const center = this.hitbox.center();
		return Rectangle.fromCenter(
			center.x, center.y,
			SpiderData.BOUNDING_BOX_SIZE, SpiderData.BOUNDING_BOX_SIZE,
		);
	}
}


LoadingManager.onload(() => {
	EntitySpawner.register(new Spawnable(
		"spiders",
		true,
		(tileRegion: Rectangle, safeRegion: Rectangle, world: World) => {
			EntitySpawner.spawnEntities(
				tileRegion.area() / (RoomData.SIZE ** 2) * SpiderData.SPIDERS_PER_ROOM,
				SpiderData.SPAWN_EVENNESS,
				tileRegion,
				[
					EntitySpawner.spawnRequirements.replaceEmpty,
					EntitySpawner.spawnRequirements.solidAdjacent,
				],
				Spider.spawn,
				safeRegion,
				world,
			);
		},
	));
});
