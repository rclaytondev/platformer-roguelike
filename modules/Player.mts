import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { ArrayUtils } from "../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Direction, Directions } from "../utils-ts/modules/geometry/Direction.mjs";
import { Rectangle } from "../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../utils-ts/modules/math/MathUtils.mjs";
import { ChainData, ItemData, PlayerData, WorldData } from "./constants/GameData.mjs";
import { Chain } from "./entities/Chain.mjs";
import { Debug } from "./game-utilities/Debug.mjs";
import { GeomUtils } from "./game-utilities/GeomUtils.mjs";
import { GraphicsUtils } from "./game-utilities/GraphicsUtils.mjs";
import { InputUtils } from "./game-utilities/InputUtils.mjs";
import { Particle } from "./game-utilities/Particle.mjs";
import { Collideable } from "./game-utilities/physics-engine/Collideable.mjs";
import { CollisionEvent } from "./game-utilities/physics-engine/CollisionEvent.mjs";
import { RectangularCollideable } from "./game-utilities/physics-engine/RectangularCollideable.mjs";
import { RandomUtils } from "./game-utilities/RandomUtils.mjs";
import { ScreenFade } from "./game-utilities/visual-effects/ScreenFade.mjs";
import { ThrowableTile } from "./items/ThrowableTile.mjs";
import { ThrowableTileEntity } from "./items/ThrowableTileEntity.mjs";
import { Main } from "./Main.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { SlopeTile } from "./tiles/SlopeTile.mjs";
import { DeathScreen } from "./user-interface/DeathScreen.mjs";
import { Renderable } from "./world/Renderer.mjs";
import { World } from "./world/World.mjs";

type Input = { [key: string]: boolean };

class DefaultState {
	update(self: Player, canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		self.velocity.y += input.KeyZ && self.velocity.y <= 0 ? PlayerData.GRAVITY_WHILE_JUMPING : PlayerData.GRAVITY;
		self.checkFriction();
	}

	checkInputs(self: Player, canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		self.checkDirectionInputs(input);
		self.checkMoveInputs();
		self.checkJumpInputs();
		self.checkThrowInputs(canvasIO);
		self.checkCrouchInputs(input);
		self.checkPickUpInputs();
		self.checkClimbStartInputs(input);
	}
}

class ClimbingState {
	chain: Chain;

	constructor(chain: Chain) {
		this.chain = chain;
	}

	checkInputs(self: Player, canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		this.checkClimbingInputs(self, input);
		self.checkFriction();
		this.checkJumpInputs(self, input, canvasIO);
		this.checkChainEnd(self);
	}
	checkClimbingInputs(self: Player, input: Input) {
		if(input.ArrowUp) {
			self.velocity = new Vector(0, -ChainData.CLIMB_SPEED);
		}
		else if(input.ArrowDown) {
			self.velocity = new Vector(0, ChainData.CLIMB_SPEED);
		}
		else {
			self.velocity = new Vector(0, 0);
		}
	}
	checkJumpInputs(self: Player, input: Input, canvasIO: CanvasIO) {
		if(input.ArrowDown) {
			if(canvasIO.keys.KeyZ) {
				self.state = new DefaultState();
			}
		}
		else {
			const jumped = self.checkJumpInputs();
			if(jumped) {
				self.hasDoubleJump = true;
			}
		}
	}
	checkChainEnd(self: Player) {
		if(!self.hitbox.intersects(this.chain.climbRegion())) {
			self.state = new DefaultState();
		}
	}

	update(self: Player, canvasIO: CanvasIO) {
		self.hasDoubleJump = true;
		self.uncrouch();
		this.snapToCenter(self);
		this.checkOnGround(self, canvasIO);
	}
	checkOnGround(self: Player, canvasIO: CanvasIO) {
		const onGround = !self.canMove("down", self.world);
		const input = Debug.getInput(canvasIO);
		if(onGround && !input.ArrowUp) {
			self.state = new DefaultState();
		}
	}
	snapToCenter(self: Player) {
		const centerX = (this.chain.tilePosition.x + 1/2) * WorldData.TILE_SIZE;
		const targetX = GeomUtils.moveTowards(self.hitbox.center().x, centerX, ChainData.SNAP_SPEED);
		self.move(new Vector(targetX - self.hitbox.center().x, 0), self.world, { });
	}
}

class Buffer {
	private key: string;
	private timeSincePress: number = Infinity;

	constructor(key: string) {
		this.key = key;
	}

	update(input: Input) {
		this.timeSincePress ++;
		if(input[this.key] && !InputUtils.pastKeys[this.key]) {
			this.timeSincePress = 0;
		}
	}
	isActive() {
		return this.timeSincePress < PlayerData.BUFFER_FRAMES;
	}
	reset() {
		this.timeSincePress = Infinity;
	}
}

class StoredVelocity {
	readonly axis: "x" | "y";
	amount: number = 0;
	position: number = 0;
	timeLeft: number = 0;

	constructor(axis: "x" | "y") {
		this.axis = axis;
	}

	update(player: Player) {
		if(this.amount === 0 || this.timeLeft <= 0) { return; }
		this.timeLeft --;

		if(this.shouldApply(player)) {
			this.apply(player);
		}
	}

	direction() {
		if(this.axis === "x") {
			return this.amount < 0 ? "left" : "right";
		}
		else {
			return this.amount < 0 ? "up" : "down";
		}
	}

	shouldApply(player: Player) {
		const direction = this.direction();
		return (
			Math.sign(player.hitbox[this.axis] - this.position) !== -Math.sign(this.amount)
			&& player.canMove(direction, player.world)
		);
	}
	apply(player: Player) {
		player.velocity[this.axis] = this.amount;
		this.amount = 0;
	}

	store(player: Player) {
		if(player.velocity[this.axis] !== 0) {
			this.amount = player.velocity[this.axis];
			this.timeLeft = PlayerData.STORED_VELOCITY_FRAMES;
			this.position = player.hitbox[this.axis];
		}
	}
}

export class Player extends RectangularCollideable {
	velocity: Vector = new Vector(0, 0);
	hasDoubleJump: boolean = false;
	dead: boolean = false;
	facing: "left" | "right" = "left";
	keyDirection: "left" | "right" | null = null;
	coyoteTime: number = 0;
	health: number = PlayerData.INITIAL_HEALTH;
	invulnerabilityTime: number = 0;
	squishFactor: number = 1;
	state: DefaultState | ClimbingState = new DefaultState();
	storedVelocityX: StoredVelocity = new StoredVelocity("x");
	storedVelocityY: StoredVelocity = new StoredVelocity("y");

	readonly jumpBuffer: Buffer = new Buffer("KeyZ");
	readonly pickupBuffer: Buffer = new Buffer("Space");
	readonly throwBuffer1: Buffer = new Buffer("KeyX");
	readonly throwBuffer2: Buffer = new Buffer("KeyC");

	equippedItems: [ThrowableTile | null, ThrowableTile | null] = [null, null];

	constructor(world: World) {
		super(Rectangle.fromDimensions(0, -WorldData.TILE_SIZE, PlayerData.HITBOX_WIDTH, PlayerData.HITBOX_HEIGHT), world);
	}

	render() {
		return [
			new Renderable(this.display.bind(this), "player"),
			new Renderable(this.displayGlowEffect.bind(this), "glow"),
		];
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		const center = this.hitbox.center();
		this.applySquish(canvasIO, center);
		this.displayBody(canvasIO);
		this.displayFace(canvasIO);
		canvasIO.ctx.restore();
	}
	displayGlowEffect(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		GraphicsUtils.glowCircle(center.x, center.y, PlayerData.GLOW_SIZE, PlayerData.GLOW_INTENSITY, canvasIO);
	}

	applySquish(canvasIO: CanvasIO, center: Vector = this.hitbox.center()) {
		canvasIO.ctx.translate(center.x, center.y);
		canvasIO.ctx.scale(this.squishFactor, 1 / this.squishFactor);
		canvasIO.ctx.translate(-center.x, -center.y);
	}

	displayBody(canvasIO: CanvasIO) {
		canvasIO.ctx.fillStyle = PlayerData.BODY_COLOR;
		const offset = MathUtils.constrain(-this.velocity.x, -PlayerData.MAX_BODY_SLANT, PlayerData.MAX_BODY_SLANT);
		const crouched = this.isCrouched();
		const y = crouched ? PlayerData.CROUCHED_BODY_Y : PlayerData.BODY_Y;
		const height = crouched ? PlayerData.CROUCHED_BODY_HEIGHT : PlayerData.BODY_HEIGHT;
		canvasIO.fillPoly(
			this.hitbox.left, this.hitbox.y + y,
			this.hitbox.left + offset, this.hitbox.y + y + height,
			this.hitbox.right + offset, this.hitbox.y + y + height,
			this.hitbox.right, this.hitbox.y + y,
		);
	}
	displayFace(canvasIO: CanvasIO) {
		const center = this.hitbox.center();
		canvasIO.ctx.fillStyle = PlayerData.BODY_COLOR;
		canvasIO.fillCircle(center.x, this.hitbox.y + PlayerData.HEAD_Y, PlayerData.HEAD_RADIUS);

		const faceRect = PlayerData.FACE.translate(new Vector(center.x, this.hitbox.y + PlayerData.HEAD_Y));
		const reflectedRect = (this.facing === "left") ? faceRect.reflectX(center.x) : faceRect;
		canvasIO.ctx.save();
		canvasIO.ctx.beginPath();
		canvasIO.circle(center.x, this.hitbox.y + PlayerData.HEAD_Y, PlayerData.HEAD_RADIUS);
		canvasIO.ctx.clip();
		canvasIO.ctx.fillStyle = PlayerData.FACE_COLOR;
		canvasIO.fillRect(reflectedRect);
		canvasIO.ctx.restore();

		canvasIO.ctx.fillStyle = PlayerData.EYE_COLOR;
		canvasIO.fillDiamond(
			center.x + (this.facing === "right" ? 1 : -1) * PlayerData.EYE_OFFSET.x,
			this.hitbox.y + PlayerData.EYE_OFFSET.y,
			PlayerData.EYE_RADIUS,
		);
	}

	update(canvasIO: CanvasIO) {
		if(Main.screen instanceof RoomEditor) { return; }
		const input = Debug.getInput(canvasIO);
		this.updateBuffers(input);

		this.state.checkInputs(this, canvasIO);
		this.updateCrouching();
		this.state.update(this, canvasIO);
		this.updateCoyoteTime();
		this.coyoteTime --;
		this.invulnerabilityTime --;
		this.squishFactor = GeomUtils.moveTowards(this.squishFactor, 1, PlayerData.SQUISH_RETURN_SPEED);
		if(this.onGround()) {
			this.hasDoubleJump = true;
			if(this.isCrouched()) {
				this.velocity.x *= PlayerData.CROUCHED_FRICTION;
			}
		}
		this.storedVelocityX.update(this);
		this.storedVelocityY.update(this);
		this.move(new Vector(this.velocity.x, 0), this.world, { });
		this.move(new Vector(0, this.velocity.y), this.world, {});
	}
	updateCoyoteTime() {
		const onGround = this.onGround();
		if(onGround) {
			this.coyoteTime = PlayerData.COYOTE_FRAMES;
		}
	}
	updateCrouching() {
		if(this.velocity.y > 0) {
			this.uncrouch();
		}
	}
	onCollision(collision: CollisionEvent): void {
		if(collision.movingObject === this) {
			const corrected = this.applyCornerCorrection(collision);
			if(Directions.isVertical(collision.direction)) {
				if(collision.directionOf(this) === "down" && this.velocity.y > PlayerData.GRAVITY) {
					this.squishFactor = PlayerData.GROUND_SQUISH_AMOUNT;
				}
				if(!corrected) {
					this.storedVelocityY.store(this);
					this.velocity.y = 0;
				}
			}
			else if(!corrected) {
				this.storedVelocityX.store(this);
				this.velocity.x = 0;
			}
		}
	}
	shouldCornerCorrect(collision: CollisionEvent) {
		const collider = collision.collidingObject(this);
		const isSlope = !(collider instanceof Collideable) && collider.tile instanceof SlopeTile;
		const direction = collision.directionOf(this);
		return direction !== "down" && !isSlope;
	}
	cornerCorrectionDirections(direction: Direction): Direction[] {
		if(Directions.isHorizontal(direction)) {
			return ["up", "down"];
		}
		const result: Direction[] = [];
		const storedX = this.storedVelocityX.timeLeft > 0 ? this.storedVelocityX.amount : 0;
		if(this.velocity.x >= 0 && storedX >= 0) {
			result.push("right");
		}
		if(this.velocity.x <= 0 && storedX <= 0) {
			result.push("left");
		}
		return result;
	}
	applyCornerCorrection(collision: CollisionEvent) {
		if(!this.shouldCornerCorrect(collision)) { return false; }
		const direction = collision.directionOf(this);
		const originalHitbox = this.hitbox;
		const directions = this.cornerCorrectionDirections(direction);
		for(let amount = 1; amount < PlayerData.CORNER_CORRECTION_DIST; amount ++) {
			for(const correctionDirection of directions) {
				this.hitbox = originalHitbox.translate(Vector.unit(correctionDirection).multiply(amount));
				const moved = this.translateIfUnobstructed(direction, _ => true);
				if(moved) {
					return true;
				}
			}
		}
		this.hitbox = originalHitbox;
		return false;
	}
	updateBuffers(input: Input) {
		this.jumpBuffer.update(input);
		this.pickupBuffer.update(input);
		this.throwBuffer1.update(input);
		this.throwBuffer2.update(input);
	}
	checkDirectionInputs(input: Input) {
		if(input.ArrowLeft && (!input.ArrowRight || !InputUtils.pastKeys.ArrowLeft)) {
			this.keyDirection = "left";
		}
		if(input.ArrowRight && (!input.ArrowLeft || !InputUtils.pastKeys.ArrowRight)) {
			this.keyDirection = "right";
		}
		if(!input.ArrowLeft && !input.ArrowRight) {
			this.keyDirection = null;
		}
	}
	checkMoveInputs() {
		if(this.keyDirection === "right" && !Debug.freeCameraMode && this.velocity.x < PlayerData.MAX_X_VELOCITY) {
			this.velocity.x = GeomUtils.moveTowards(this.velocity.x, PlayerData.MAX_X_VELOCITY, PlayerData.HORIZONTAL_ACCELERATION);
			this.facing = "right";
		}
		if(this.keyDirection === "left" && !Debug.freeCameraMode && this.velocity.x > -PlayerData.MAX_X_VELOCITY) {
			this.velocity.x = GeomUtils.moveTowards(this.velocity.x, -PlayerData.MAX_X_VELOCITY, PlayerData.HORIZONTAL_ACCELERATION);
			this.facing = "left";
		}
	}
	checkFriction() {
		if(this.keyDirection === null) {
			this.velocity.x *= PlayerData.NOKEY_FRICTION_X;
		}
		else if(
			(this.keyDirection === "left" && (this.velocity.x > 0 || this.velocity.x < -PlayerData.MAX_X_VELOCITY)) ||
			(this.keyDirection === "right" && (this.velocity.x < 0 || this.velocity.x > PlayerData.MAX_X_VELOCITY))
		) {
			this.velocity.x *= PlayerData.OVERLIMIT_FRICTION_X;
		}
	}
	checkJumpInputs() {
		if(this.jumpBuffer.isActive() && (this.coyoteTime > 0 || this.hasDoubleJump)) {
			this.jumpBuffer.reset();
			this.jump();
			return true;
		}
		return false;
	}
	checkThrowInputs(canvasIO: CanvasIO) {
		if(this.throwBuffer1.isActive()) {
			const used = this.equippedItems[0]?.use(this.world, canvasIO);
			if(used) {
				this.throwBuffer1.reset();
				this.equippedItems[0] = null;
			}
		}
		if(this.throwBuffer2.isActive()) {
			const used = this.equippedItems[1]?.use(this.world, canvasIO);
			if(used) {
				this.throwBuffer2.reset();
				this.equippedItems[1] = null;
			}
		}
	}
	checkCrouchInputs(input: Input) {
		if(input.ArrowDown && this.onGround()) {
			this.crouch();
		}
		if(!input.ArrowDown && this.onGround()) {
			this.uncrouch();
		}
	}
	checkPickUpInputs() {
		if(this.pickupBuffer.isActive()) {
			const collected = this.collectNearestItem();
			if(collected) {
				this.pickupBuffer.reset();
			}
		}
	}
	checkClimbStartInputs(input: Input) {
		const up = input.ArrowUp;
		const down = (input.ArrowDown && !this.onGround());
		if(up || down) {
			const chain = ([...this.world.entities.possiblyIntersecting(this.hitbox)]
				.find(e => e instanceof Chain && e.climbRegion().intersects(this.hitbox))
			) as Chain | undefined;
			const shouldClimb = chain && (
				!chain.isClimbed
				|| (up && !InputUtils.pastKeys.ArrowUp)
				|| (down && !InputUtils.pastKeys.ArrowDown)
			);
			if(shouldClimb) {
				this.state = new ClimbingState(chain);
				chain.isClimbed = true;
			}
		}
	}
	onGround() {
		return !this.canMove("down", this.world);
	}
	damage() {
		if(this.invulnerabilityTime < 0) {
			this.health --;
			this.world.worldScreen?.visualEffects.effectsList.add(new ScreenFade(
				PlayerData.DAMAGE_FLASH_TIME,
				PlayerData.DAMAGE_FLASH_OPACITY, 0,
				PlayerData.DAMAGE_FLASH_COLOR,
				"damage-flash",
			));
			if(this.health <= 0 && !this.dead) {
				DeathScreen.show(this.world);
				this.dead = true;
				this.world.entities.delete(this);
			}
			this.invulnerabilityTime = PlayerData.INVULNERABIlITY_TIME;
		}
	}

	jump() {
		this.velocity.y = -PlayerData.JUMP_VELOCITY;
		this.hasDoubleJump = (this.coyoteTime > 0);
		this.coyoteTime = -1;
		this.squishFactor = PlayerData.JUMP_SQUISH_AMOUNT;
		this.state = new DefaultState();
		this.resetVelocityToDirection();
		if(this.keyDirection !== null) {
			this.velocity = this.velocity.add(Vector.unit(this.keyDirection).multiply(PlayerData.JUMP_X_VELOCITY));
		}
		this.addJumpParticles();
	}
	resetVelocityToDirection() {
		if(this.keyDirection === "left") {
			this.velocity.x = Math.min(this.velocity.x, -PlayerData.REVERSE_JUMP_X_VELOCITY);
		}
		else if(this.keyDirection === "right") {
			this.velocity.x = Math.max(this.velocity.x, PlayerData.REVERSE_JUMP_X_VELOCITY);
		}
	}
	addJumpParticles() {
		const hitboxBottom = this.hitbox.edgeCenter("down");
		for(let i = 0; i < PlayerData.JUMP_PARTICLES.AMOUNT; i ++) {
			const position = new Vector(
				hitboxBottom.x + RandomUtils.random(-PlayerData.JUMP_PARTICLES.SPAWN_RECT_WIDTH / 2, PlayerData.JUMP_PARTICLES.SPAWN_RECT_WIDTH / 2),
				hitboxBottom.y,
			);
			const particle = new Particle(
				position,
				RandomUtils.randomInCircle(0, 0, PlayerData.JUMP_PARTICLES.MAX_SPEED),
				PlayerData.JUMP_PARTICLES.SETTINGS,
			);
			this.world.particles.add(particle, this.world);
		}
	}

	crouch() {
		this.hitbox = this.hitbox.extend("up", PlayerData.CROUCHED_HITBOX_HEIGHT - this.hitbox.height);
	}
	uncrouch() {
		const newHitbox = this.hitbox.extend("up", PlayerData.HITBOX_HEIGHT - this.hitbox.height);
		if(!this.world.isInSolid(newHitbox, o => o !== this)) {
			this.hitbox = newHitbox;
		}
	}
	isCrouched() {
		return this.hitbox.height === PlayerData.CROUCHED_HITBOX_HEIGHT;
	}

	itemThrowVelocity(canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		if(input.ArrowDown) {
			return ItemData.DOWN_THROW_VELOCITY.clone();
		}
		return (this.facing === "left") ? ItemData.THROW_VELOCITY.reflectX() : ItemData.THROW_VELOCITY.clone();
	}
	throwDirection(canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		if(input.ArrowDown) {
			return "down";
		}
		return this.facing;
	}
	attemptThrow(item: ThrowableTileEntity, itemCenter: Vector, world: World, canvasIO: CanvasIO) {
		const throwStart = new Vector(itemCenter.x - item.hitbox.width / 2, itemCenter.y - item.hitbox.height / 2);
		if(!world.isInSolid(item.hitbox.translate(throwStart))) {
			item.translate(throwStart);
			item.velocity = this.itemThrowVelocity(canvasIO);
			world.entities.add(item);
			return true;
		}
		return false;
	}
	throw(item: ThrowableTileEntity, world: World, canvasIO: CanvasIO) {
		const direction = this.throwDirection(canvasIO);
		const size = (direction === "down" ? item.hitbox.height : item.hitbox.width);
		const throwStartCenter = (
			this.hitbox.edgeCenter(direction).add(Vector.unit(direction)
			.multiply(ItemData.THROW_OFFSET + size / 2)
			.add(0, Directions.isHorizontal(direction) ? ItemData.THROW_OFFSET_Y : 0),
		));
		const hitbox = Rectangle.fromCenter(throwStartCenter.x, throwStartCenter.y, item.hitbox.width, item.hitbox.height);

		const maxDists = (
			Directions.isHorizontal(direction)
			? {
				"clockwise": world.rectIntersectionDistance(hitbox, Directions.rotateClockwise[direction], ItemData.THROW_CORRECTION, () => true),
				"counterclockwise": world.rectIntersectionDistance(hitbox, Directions.rotateClockwise[direction], ItemData.THROW_CORRECTION, () => true),
			}
			: {
				"clockwise": ItemData.THROW_CORRECTION,
				"counterclockwise": ItemData.THROW_CORRECTION,
			}
		);

		for(let correctionAmount = 0; correctionAmount < ItemData.THROW_CORRECTION; correctionAmount ++) {
			for(const angularDirection of ["clockwise", "counterclockwise"] as const) {
				if(correctionAmount < maxDists[angularDirection]) {
					const correctionDirection = Directions.rotate[angularDirection][direction];
					const threw = this.attemptThrow(item, throwStartCenter.add(Vector.unit(correctionDirection).multiply(correctionAmount)), world, canvasIO);
					if(threw) {
						if(Directions.isHorizontal(direction)) {
							const opposite = Directions.opposite[direction];
							this.velocity = this.velocity.add(Vector.unit(opposite).multiply(ItemData.THROW_RECOIL));
						}
						return true;
					}
				}
			}
		}
		return false;
	}
	collectNearestItem() {
		const rect = this.hitbox.extend("all", ItemData.PICKUP_DISTANCE);
		const allItems = [...this.world.entities.collideablesIntersecting(rect)].filter(i => i instanceof ThrowableTileEntity);
		if(allItems.length !== 0) {
			const closest = ArrayUtils.minValue(allItems, item => item.hitbox.distanceToRect(this.hitbox));
			const collected = this.collect(closest, this.world);
			return collected;
		}
		return false;
	}
	collect(itemEntity: ThrowableTileEntity, world: World) {
		const firstEmptySlot = this.equippedItems.indexOf(null);
		if(firstEmptySlot !== -1) {
			this.equippedItems[firstEmptySlot] = itemEntity.getItem();
			for(const modifier of this.equippedItems[firstEmptySlot].modifiers) {
				modifier.reset();
			}
			world.entities.delete(itemEntity);
			return true;
		}
		return false;
	}
}
