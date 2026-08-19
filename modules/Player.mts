import { CanvasIO } from "../utils-ts/modules/CanvasIO.mjs";
import { ArrayUtils } from "../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Directions } from "../utils-ts/modules/geometry/Direction.mjs";
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
import { CollisionEvent } from "./game-utilities/physics-engine/CollisionEvent.mjs";
import { RectangularCollideable } from "./game-utilities/physics-engine/RectangularCollideable.mjs";
import { RandomUtils } from "./game-utilities/RandomUtils.mjs";
import { ScreenFade } from "./game-utilities/visual-effects/ScreenFade.mjs";
import { ThrowableTile } from "./items/ThrowableTile.mjs";
import { ThrowableTileEntity } from "./items/ThrowableTileEntity.mjs";
import { Main } from "./Main.mjs";
import { RoomEditor } from "./RoomEditor.mjs";
import { DeathScreen } from "./user-interface/DeathScreen.mjs";
import { Renderable } from "./world/Renderer.mjs";
import { World } from "./world/World.mjs";

type Input = { [key: string]: boolean };

class DefaultState {
	update(self: Player, world: World, canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		self.velocity.y += input.KeyZ && self.velocity.y <= 0 ? PlayerData.GRAVITY_WHILE_JUMPING : PlayerData.GRAVITY;
		self.velocity.x = MathUtils.constrain(self.velocity.x, -PlayerData.MAX_X_VELOCITY, PlayerData.MAX_X_VELOCITY);
		self.checkFriction(input);
	}

	checkInputs(self: Player, world: World, canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		self.checkMoveInputs(world, input);
		self.checkJumpInputs(world, input, canvasIO);
		self.checkThrowInputs(world, input, canvasIO);
		self.checkCrouchInputs(world, input, canvasIO);
		self.checkPickUpInputs(world, input);
		self.checkClimbStartInputs(world, input, canvasIO);
	}
}

class ClimbingState {
	chain: Chain;

	constructor(chain: Chain) {
		this.chain = chain;
	}

	checkInputs(self: Player, world: World, canvasIO: CanvasIO) {
		const input = Debug.getInput(canvasIO);
		this.checkClimbingInputs(self, world, input);
		self.checkFriction(input);
		this.checkJumpInputs(self, world, input, canvasIO);
	}
	checkClimbingInputs(self: Player, world: World, input: Input) {
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
	checkJumpInputs(self: Player, world: World, input: Input, canvasIO: CanvasIO) {
		if(input.ArrowDown) {
			if(canvasIO.keys.KeyZ) {
				self.state = new DefaultState();
			}
		}
		else {
			const jumped = self.checkJumpInputs(world, input, canvasIO);
			if(jumped) {
				self.hasDoubleJump = true;
			}
		}
	}

	update(self: Player, world: World, canvasIO: CanvasIO) {
		self.hasDoubleJump = true;
		this.snapToCenter(self, world, canvasIO);
		this.checkOnGround(self, world, canvasIO);
	}
	checkOnGround(self: Player, world: World, canvasIO: CanvasIO) {
		const onGround = !self.canMove("down", world, canvasIO);
		const input = Debug.getInput(canvasIO);
		if(onGround && !input.ArrowUp) {
			self.state = new DefaultState();
		}
	}
	snapToCenter(self: Player, world: World, canvasIO: CanvasIO) {
		const centerX = (this.chain.tilePosition.x + 1/2) * WorldData.TILE_SIZE;
		const targetX = GeomUtils.moveTowards(self.hitbox.center().x, centerX, ChainData.SNAP_SPEED);
		self.move(new Vector(targetX - self.hitbox.center().x, 0), world, canvasIO, { });
	}
}

export class Player extends RectangularCollideable {
	velocity: Vector = new Vector(0, 0);
	hasDoubleJump: boolean = false;
	dead: boolean = false;
	facing: "left" | "right" = "left";
	coyoteTime: number = 0;
	health: number = PlayerData.INITIAL_HEALTH;
	invulnerabilityTime: number = 0;
	squishFactor: number = 1;
	state: DefaultState | ClimbingState = new DefaultState();

	equippedItems: [ThrowableTile | null, ThrowableTile | null] = [null, null];

	constructor() {
		super(Rectangle.fromDimensions(0, -WorldData.TILE_SIZE, PlayerData.HITBOX_WIDTH, PlayerData.HITBOX_HEIGHT));
	}

	render() {
		return [new Renderable(this.display.bind(this), "player")];
	}
	display(canvasIO: CanvasIO) {
		canvasIO.ctx.save();
		const center = this.hitbox.center();
		this.applySquish(canvasIO, center);
		this.displayBody(canvasIO);
		this.displayFace(canvasIO);
		canvasIO.ctx.restore();

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

	update(world: World, canvasIO: CanvasIO) {
		if(Main.screen instanceof RoomEditor) { return; }
		this.state.checkInputs(this, world, canvasIO);
		this.updateCrouching(world);
		this.state.update(this, world, canvasIO);
		this.updateCoyoteTime(world, canvasIO);
		this.coyoteTime --;
		this.invulnerabilityTime --;
		this.squishFactor = GeomUtils.moveTowards(this.squishFactor, 1, PlayerData.SQUISH_RETURN_SPEED);
		if(this.onGround(world, canvasIO)) {
			this.hasDoubleJump = true;
			if(this.isCrouched()) {
				this.velocity.x *= PlayerData.CROUCHED_FRICTION;
			}
		}
		this.move(new Vector(this.velocity.x, 0), world, canvasIO, { });
		this.move(new Vector(0, this.velocity.y), world, canvasIO, {});
	}
	updateCoyoteTime(world: World, canvasIO: CanvasIO) {
		const onGround = this.onGround(world, canvasIO);
		if(onGround) {
			this.coyoteTime = PlayerData.COYOTE_FRAMES;
		}
	}
	updateCrouching(world: World) {
		if(this.velocity.y > 0) {
			this.uncrouch(world);
		}
	}
	onCollision(collision: CollisionEvent): void {
		if(collision.movingObject === this) {
			if(Directions.isVertical(collision.direction)) {
				if(collision.directionOf(this) === "down" && this.velocity.y > PlayerData.GRAVITY) {
					this.squishFactor = PlayerData.GROUND_SQUISH_AMOUNT;
				}
				this.velocity.y = 0;
			}
			else {
				this.velocity.x = 0;
			}
		}
	}
	checkMoveInputs(world: World, input: Input) {
		if(input.ArrowRight && !input.ArrowLeft && !Debug.freeCameraMode) {
			this.velocity.x += PlayerData.HORIZONTAL_ACCELERATION;
			this.facing = "right";
		}
		if(input.ArrowLeft && !input.ArrowRight && !Debug.freeCameraMode) {
			this.velocity.x -= PlayerData.HORIZONTAL_ACCELERATION;
			this.facing = "left";
		}
	}
	checkFriction(input: Input) {
		if(
			(!input.ArrowLeft && !input.ArrowRight) ||
			(input.ArrowLeft && this.velocity.x > 0) ||
			(input.ArrowRight && this.velocity.x < 0)
		) {
			this.velocity.x *= PlayerData.FRICTION_X;
		}
	}
	checkJumpInputs(world: World, input: Input, canvasIO: CanvasIO) {
		if(input.KeyZ && !InputUtils.pastKeys.KeyZ && (this.coyoteTime > 0 || this.hasDoubleJump)) {
			this.jump(world, canvasIO);
			return true;
		}
		return false;
	}
	checkThrowInputs(world: World, input: Input, canvasIO: CanvasIO) {
		if(input.KeyX && !InputUtils.pastKeys.KeyX) {
			const used = this.equippedItems[0]?.use(world, canvasIO);
			if(used) { this.equippedItems[0] = null; }
		}
		if(input.KeyC && !InputUtils.pastKeys.KeyC) {
			const used = this.equippedItems[1]?.use(world, canvasIO);
			if(used) { this.equippedItems[1] = null; }
		}
	}
	checkCrouchInputs(world: World, input: Input, canvasIO: CanvasIO) {
		if(input.ArrowDown && this.onGround(world, canvasIO)) {
			this.crouch();
		}
		if(!input.ArrowDown && this.onGround(world, canvasIO)) {
			this.uncrouch(world);
		}
	}
	checkPickUpInputs(world: World, input: Input) {
		if(input.Space && !InputUtils.pastKeys.Space) {
			this.collectNearestItem(world);
		}
	}
	checkClimbStartInputs(world: World, input: Input, canvasIO: CanvasIO) {
		const up = input.ArrowUp;
		const down = (input.ArrowDown && !this.onGround(world, canvasIO));
		if(up || down) {
			const chain = ([...world.entities.possiblyIntersecting(this.hitbox)]
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
	onGround(world: World, canvasIO: CanvasIO) {
		return !this.canMove("down", world, canvasIO);
	}
	damage(hurtbox: Rectangle, world: World) {
		if(this.invulnerabilityTime < 0) {
			this.health --;
			world.worldScreen?.visualEffects.effectsList.add(new ScreenFade(
				PlayerData.DAMAGE_FLASH_TIME,
				PlayerData.DAMAGE_FLASH_OPACITY, 0,
				PlayerData.DAMAGE_FLASH_COLOR,
				"damage-flash",
			));
			if(this.health <= 0 && !this.dead) {
				DeathScreen.show(world);
				this.dead = true;
				world.entities.delete(this);
			}
			this.invulnerabilityTime = PlayerData.INVULNERABIlITY_TIME;
		}
	}

	jump(world: World, canvasIO: CanvasIO) {
		this.velocity.y = -PlayerData.JUMP_VELOCITY;
		this.hasDoubleJump = (this.coyoteTime > 0);
		this.coyoteTime = -1;
		this.squishFactor = PlayerData.JUMP_SQUISH_AMOUNT;
		this.state = new DefaultState();
		this.addJumpParticles(world, canvasIO);
	}
	addJumpParticles(world: World, canvasIO: CanvasIO) {
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
			world.particles.add(particle, world, canvasIO);
		}
	}

	crouch() {
		this.hitbox = this.hitbox.extend("up", PlayerData.CROUCHED_HITBOX_HEIGHT - this.hitbox.height);
	}
	uncrouch(world: World) {
		const newHitbox = this.hitbox.extend("up", PlayerData.HITBOX_HEIGHT - this.hitbox.height);
		if(!world.isInSolid(newHitbox, o => o !== this)) {
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
			item.translate(throwStart, world);
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
						return true;
					}
				}
			}
		}
		return false;
	}
	collectNearestItem(world: World) {
		const rect = this.hitbox.extend("all", ItemData.PICKUP_DISTANCE);
		const allItems = [...world.entities.collideablesIntersecting(rect)].filter(i => i instanceof ThrowableTileEntity);
		if(allItems.length !== 0) {
			const closest = ArrayUtils.minValue(allItems, item => item.hitbox.distanceToRect(this.hitbox));
			this.collect(closest, world);
		}
	}
	collect(itemEntity: ThrowableTileEntity, world: World) {
		const firstEmptySlot = this.equippedItems.indexOf(null);
		if(firstEmptySlot !== -1) {
			this.equippedItems[firstEmptySlot] = itemEntity.getItem();
			for(const modifier of this.equippedItems[firstEmptySlot].modifiers) {
				modifier.reset();
			}
			world.entities.delete(itemEntity);
		}
	}
}
