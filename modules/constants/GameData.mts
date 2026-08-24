import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { ParticleSettings } from "../game-utilities/Particle.mjs";
import { Traversability } from "../level-generator/Room.mjs";
import { GateState } from "../level-generator/GateState.mjs";
import { FireSpawnerSettings } from "../game-utilities/FireSpawner.mjs";
import { GraphicsUtils } from "../game-utilities/GraphicsUtils.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";

export class WorldData {
	static TILE_SIZE = 50;
	static TILE_COLORS = {
		"tower": "rgb(30, 30, 30)",
		"stone": "rgb(59, 67, 70)",
	};
	static TILE_ACCENT_COLOR = "rgb(255, 255, 255)";
	static TILE_ACCENT_RADIUS = WorldData.TILE_SIZE * 0.35;
	static TILE_ACCENT_INSET = WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_RADIUS;
	static TILE_ACCENT_THICKNESS = 2;

	static TILE_GLOW_SIZE = 0;
	static TILE_GLOW_INTENSITY = 0.13;
	static TILE_GLOW_COLOR = {
		red: 255,
		green: 255,
		blue: 255,
	};

	static PLATFORM_THICKNESS = WorldData.TILE_SIZE * 0.1;

	static CAMERA_SPEED = 100;

	static OVERLAY_FADE_SPEED = 0.02;
	static OVERLAY_INITIAL_OPACITY = 2;
	static OVERLAY_COLOR = "white";
	static OVERLAY_FONT = "100px monospace";

	static PARTICLE_RENDER_DISTANCE_Y = 15;

	static STONE_LINE_AMOUNT = 3e-4; // 1e-2 means 1 per 10x10 grid, 1e-4 means 1 per 100x100 grid, etc
	static STONE_PATTERN_WIDTH = 600;
	static STONE_PATTERN_HEIGHT = 600;
	static STONE_LINE_EVENNESS = 30;
	static STONE_CONNECTIONS = 3;
	static STONE_LINE_COLOR = "rgb(64, 71, 74)";
	static STONE_LINE_THICKNESS = 10;

	static ENTITY_UPDATE_DISTANCE = 2000;
	static GLOW_RENDER_DISTANCE = 200;
	static ENTITY_RENDER_DISTANCE = 200;
	static ENTITY_CHUNK_SIZE = 12 * 50;
	static TILE_CHUNK_SIZE = 12;
	static TILE_UPDATE_DISTANCE = 40;
}

export class LevelGeneratorData {
	static WIDTH = 4;
	static HEIGHT = 6;
	static BORDER_X = 4;
	static BORDER_Y = 10;

	static MAIN_PATH_BRANCH_PROBABILITY_X = 0.5;
	static MAIN_PATH_BRANCH_PROBABILITY_Y = 0.5;
	static OFF_PATH_BRANCH_PROBABILITY_X = 0.5;
	static OFF_PATH_BRANCH_PROBABILITY_Y = 0.5;

	static DUPLICATE_PENALTY_MULTIPLIER = 0;
	static GENERATABILITY_MULTIPLIER = 2;
	static CONNECTIVITY_MULTIPLIER = 0;
	static WEIGHT_BONUS = 1;
};

export class WorldGeneratorData {
	static GENERATION_DISTANCE = WorldData.TILE_SIZE * 20;

	static TOWER_OUTSIDE_WIDTH = 15;
	static GROUND_DEPTH = 10;
	static GROUND_OFFSET = 8;
}

export class PlayerData {
	static HITBOX_WIDTH = WorldData.TILE_SIZE * 0.4;
	static HITBOX_HEIGHT = WorldData.TILE_SIZE * 0.8;
	static CROUCHED_HITBOX_HEIGHT = WorldData.TILE_SIZE * 0.4;
	static GRAVITY = 1;
	static GRAVITY_WHILE_JUMPING = 0.7;
	static HORIZONTAL_ACCELERATION = 0.7;
	static JUMP_VELOCITY = 14;
	static JUMP_X_VELOCITY = 1;
	static MAX_X_VELOCITY = 8;
	static NOKEY_FRICTION_X = 0.7;
	static OVERLIMIT_FRICTION_X = 0.95;
	static COYOTE_FRAMES = 4;
	static INITIAL_HEALTH = 3;
	static INVULNERABIlITY_TIME = 30;
	static CROUCHED_FRICTION = 0.8;

	static BODY_COLOR = "white";
	static BODY_Y = WorldData.TILE_SIZE * 0.35;
	static BODY_HEIGHT = WorldData.TILE_SIZE * 0.45;
	static MAX_BODY_SLANT = 7;

	static CROUCHED_BODY_HEIGHT = PlayerData.BODY_HEIGHT - WorldData.TILE_SIZE * 0.2;
	static CROUCHED_BODY_Y = PlayerData.BODY_Y - WorldData.TILE_SIZE * 0.1;

	static HEAD_Y = WorldData.TILE_SIZE * 0.2;
	static HEAD_RADIUS = WorldData.TILE_SIZE * 0.2;

	static FACE_COLOR = "rgb(130, 130, 130)";
	static FACE = Rectangle.fromDimensions(0, -5, 100, 100);

	static EYE_COLOR = "rgb(0, 128, 50)";
	static EYE_OFFSET = new Vector(7, 9);
	static EYE_RADIUS = 2;

	static GLOW_SIZE = 200;
	static GLOW_INTENSITY = 1/3;

	static JUMP_PARTICLES = {
		AMOUNT: 10,
		SPAWN_RECT_WIDTH: 30,
		MAX_SPEED: 0.5,
		SETTINGS: {
			shape: "circle",
			color: {
				red: 200,
				green: 200,
				blue: 200,
			},
			size: 5,
			sizeDecay: { min: 0.3, max: 0.5 },
			opacity: 0.5,
			opacityDecay: 0,
		} as ParticleSettings,
	};

	static JUMP_SQUISH_AMOUNT = 0.85;
	static GROUND_SQUISH_AMOUNT = 1.2;
	static SQUISH_RETURN_SPEED = 0.03;

	static DAMAGE_FLASH_TIME = 30;
	static DAMAGE_FLASH_COLOR = "rgb(255, 0, 0)";
	static DAMAGE_FLASH_OPACITY = 0.3;

	static DEATH_RESET_DELAY = 5;
	static FADE_DURATION = 30;
	static FADE_DELAY = 30;
}

export class RoomData {
	static SIZE = 12;

	static ALL_TRAVERSABILITY: Traversability = (() => {
		const connections = [];
		const states: GateState[] = [
			new GateState(null, "left", true),
			new GateState(null, "left", false),
			new GateState(null, "right", true),
			new GateState(null, "right", false),
			new GateState(null, "up", true),
			new GateState(null, "up", false),
			new GateState(null, "down", true),
			new GateState(null, "down", false),
		];
		for(const state1 of states) {
			for(const state2 of states.filter(s => s !== state1)) {
				connections.push({ start: state1, end: state2 });
			}
		}
		return connections;
	}) ();
	static NO_GATE_TRAVERSABILITY = RoomData.ALL_TRAVERSABILITY.filter(({ start, end }) => start.toggled === end.toggled);
	static ALL_GATE_STATES = [
		new GateState(null, "left", true),
		new GateState(null, "left", false),
		new GateState(null, "right", true),
		new GateState(null, "right", false),
		new GateState(null, "up", true),
		new GateState(null, "up", false),
		new GateState(null, "down", true),
		new GateState(null, "down", false),
	];
}

export class GateData {
	static COLOR = "rgb(15, 15, 15)";
	// static INNER_ACCENT_INSET = 2 * WorldData.TILE_ACCENT_INSET;
	static INNER_ACCENT_INSET = WorldData.TILE_ACCENT_INSET + (WorldData.TILE_SIZE / 2 - WorldData.TILE_ACCENT_INSET) / 2;

	static TOGGLE_DISTANCE = 5;
	static SPEED = 0.2;
	static MIN_DISPLAY_SIZE = 0.15;
	static HITBOX_SIZE = 0.8;

	static SCREEN_SHAKE_TIME = 5;
	static SCREEN_SHAKE_INTENSITY = 5;
}

export class LaserBlockData {
	/* Visual settings */
	static TILE_COLOR = "rgb(15, 15, 15)";
	static LASER_COLOR = {
		red: 0,
		green: 200,
		blue: 0,
	};
	static LASER_THICKNESS = 3;
	static LASER_GLOW_SIZE = 60;
	static LASER_GLOW_INTENSITY = 0.5;

	static ACTIVATED_THICKNESS = 6;
	static ACTIVATED_GLOW_INTENSITY = 0.7;
	static ACTIVATED_GLOW_SIZE = 100;
	static ACTIVATED_COLOR = {
		red: 255,
		green: 255,
		blue: 0,
	};

	static BARREL_COLOR = "rgb(50, 50, 50)";
	static BARREL_THICKNESS = WorldData.TILE_SIZE * 0.2;
	static BARREL_LENGTH = WorldData.TILE_SIZE * 0.4;

	/* Generation settings */
	static LASERS_PER_ROOM = 0.7;
	static SPAWN_EVENNESS = 9;


	/* Gameplay settings */
	static LASER_LINEAR_SPEED = 50;
	static SPEED = 0.015;
	static MAX_LENGTH = 300;
	static BEAMS_PER_BLOCK = 2;
	static WAIT_TIMER = 15;
	static ACTIVATED_SPEED = 0.1;
	static ACTIVATION_TIME = Math.PI / LaserBlockData.ACTIVATED_SPEED;
}

export class LizardData {
	static SPEED = 3;
	static LOOKAHEAD_DISTANCE = WorldData.TILE_SIZE * 1/2;
	static HITBOX_WIDTH = WorldData.TILE_SIZE * 1/2;
	static LOOKAHEAD_WIDTH = LizardData.HITBOX_WIDTH - 2;
	static FIRE_DURATION = 30;
	static PLAYER_DETECTION_WIDTH = WorldData.TILE_SIZE * 0.5;
	static TURN_DELAY = 7;

	static FIRE_PARTICLES: ParticleSettings = {
		color: { red: 255, green: 128, blue: 0 },
		size: WorldData.TILE_SIZE * 0.2,
		shape: "circle",
		glowSize: 30,
		glowIntensity: 1/8,
		sizeDecay: WorldData.TILE_SIZE * 0.2 / 20,
	};
	static FIRE: FireSpawnerSettings = {
		maxHurtboxSize: 100,
		hurtboxWidth: 1/2 * WorldData.TILE_SIZE,
		hurtboxOffset: WorldData.TILE_SIZE * 0.4,
		hurtboxSpeed: 6,
		particlesPerFrame: 2,
		particleSettings: LizardData.FIRE_PARTICLES,
		particleSpeed: LizardData.SPEED + 6,
		particleSpeedVariance: 2,
		particleCrossSpeedVariance: 1,
	};

	static BODY_WIDTH = WorldData.TILE_SIZE * 0.1;
	static BODY_POINTEDNESS = 2;
	static LEG_POINTEDNESS = 2;
	static LEG_SCALE = WorldData.TILE_SIZE * 0.5;
	static LEG_SPACING = LizardData.LEG_SCALE * 2; // distance between consecutive legs on the lizard's body.
	static LEG_DISTANCE = LizardData.LEG_SCALE * 0.4; // how far away perpendicularly the foot should be from the body.
	static LEG_SPEED_MULTIPLIER = 1;
	static LEG_MAX = 0.75 * LizardData.LEG_SCALE;
	static LEG_MIN = 0.75 * -LizardData.LEG_SCALE;
	static LEG_WIDTH = WorldData.TILE_SIZE * 0.1;
	static LOWER_LEG_LENGTH = LizardData.LEG_SCALE * 0.6;
	static LEG_ROTATION_START = WorldData.TILE_SIZE * 0.2;
	static LEG_ROTATION_END = WorldData.TILE_SIZE * 0.2;

	static HEAD_WIDTH = WorldData.TILE_SIZE * 0.2;
	static HEAD_HEIGHT = WorldData.TILE_SIZE * 0.3;
	static HEAD_OFFSET = -WorldData.TILE_SIZE * 0.5;
	static MOUTH_LENGTH = WorldData.TILE_SIZE;
	static MOUTH_SPEED_OPENING = 2;
	static MOUTH_SPEED_CLOSING = 3;
	static MAX_MOUTH_ANGLE = 15;
	static FIRE_MOUTH_OPENNESS = 25;
	static EYE_SIZE = WorldData.TILE_SIZE * 0.1;
	static EYE_Y = WorldData.TILE_SIZE * 0.3;
	static EYE_COLOR = "rgb(255, 128, 0)";
	static HEAD_ROTATION_SPEED = 0.2;

	static LIGHT_SIZE = 100;
	static LIGHT_INTENSITY = 0.3;
	static GLOW_COLOR = {
		red: 255,
		green: 128,
		blue: 0,
	};

	static LIZARDS_PER_ROOM = 0.6;
	static MIN_LENGTH = 2;
	static MAX_LENGTH = 7;
	static SPAWN_EVENNESS = 7; // higher number = more evenly distributed
	static MIN_PLAYER_SPAWN_DISTANCE = 600;

	static DAMAGE_PARTICLES = {
		VELOCITY: {
			X: 0.5,
			Y: {
				MIN: -0.5,
				MAX: 0,
			},
		},
		SETTINGS: {
			color: { red: 0, green: 0, blue: 0 },
			size: Infinity,
			gravity: PlayerData.GRAVITY / 4,
			opacityDecay: 0.05,
			rotation: 0,
			rotationalVelocity: { min: -0.01, max: 0.01 },
		},
	};
}

export type BackgroundGearLayerData = {
	minSize: number;
	maxSize: number;
	color: string;
	parallax: number;
	minSpeed: number;
	maxSpeed: number;
	density: number;
	evenness: number;
	minTeeth: number;
	maxTeeth: number;
	minInnerRadius: number;
	maxInnerRadius: number;
	blur: number;
}
export class BackgroundData {
	static BACKGROUND_COLOR = "rgb(30, 30, 30)";
	static MAX_GEAR_SPAWN_ATTEMPTS = 30;

	static SKY_BACKGROUND_COLORS = [
		{ color: "rgb(30, 20, 50)", y: 0 },
		{ color: "rgb(75, 40, 100)", y: 0.5 },
		{ color: "rgb(50, 64, 128)", y: 1 },
	];
	static STAR_DENSITY = 0.0001;
	static STAR_EVENNESS = 6;
	static STAR_SIZE = 1;

	static BACKGROUND_REPEAT_SIZE = 2400;
	static LAYERS: BackgroundGearLayerData[] = [
		{
			minSize: 100,
			maxSize: 200,
			color: "rgb(20, 20, 20)",
			parallax: 0.75,
			minSpeed: 0.25,
			maxSpeed: 0.75,
			density: 0.000025,
			evenness: 5,
			minTeeth: 6,
			maxTeeth: 8,
			minInnerRadius: 0.8,
			maxInnerRadius: 0.8,
			blur: 6,
		},
	];
}
export class SpikeballData {
	static RADIUS = WorldData.TILE_SIZE * 0.3;
	static WING_WIDTH = 15;
	static SPIKE_LENGTH = 20;
	static INNER_LENGTH = 5;

	static COLOR = "rgb(0, 0, 0)";
	static ACCENT_COLOR = {
		red: 255,
		green: 255,
		blue: 0,
	};
	static GLOW_SIZE = 75;
	static GLOW_INTENSITY = 0.4;
	static GLOW_FADE_TIME = 20;

	static SPEED = 5;
	static BOUNCES = 3;
	static HURTBOX_SIZE = WorldData.TILE_SIZE * 1.8;
	static TELEGRAPH_DELAY = 33;
	static ATTACK_DURATION = 20;
	static CORNER_BOUNCE_DIST = 3;

	static TELEGRAPH_RADIUS = SpikeballData.HURTBOX_SIZE / 2;
	static TELEGRAPH_THICKNESS = 20;

	static NUM_ELECTRIC_ARCS = 3;
	static ELECTRICITY_COLOR = "yellow";
	static ELECTRICITY_SEGMENTS = 4;
	static ELECTRICITY_EVENNESS = 6;
	static ELECTRICITY_WIDTH = 1;

	static SHATTER_PIECES = 10;
	static SHATTER_PARTICLE_SPEED = 3;
	static SHATTER_ANGLE_EVENNESS = 10;
	static SHATTER_PARTICLE_SETTINGS: ParticleSettings = {
		color: { red: 0, green: 0, blue: 0 },
		size: 1,
		opacityDecay: 1/15,
		rotationalVelocity: { min: -0.1, max: 0.1 },
		gravity: 0.2,
	};
}

export type SpikeballPattern = ["left" | "right", "up" | "down"][][];

export class SpikeballBlockData {
	static SPAWN_FREQUENCY = 40;
	static SPAWN_EVENNESS = 5;
	static SPIKEBALLS_PER_ROOM = 0.4;
	static PATTERNS: SpikeballPattern[] = [
		[
			// pattern 1:
			[
				["left", "up"],
				["right", "down"],
			],
			[
				["left", "down"],
				["right", "up"],
			],
		],
	];
	static BOUNCES_LEFT_BEFORE_SPAWN = 2;

	static TILE_COLOR = LaserBlockData.TILE_COLOR;
	static DOOR_COLOR = "rgb(50, 50, 50)";
	static DOOR_OPENING_SPEED = 2;
	static DOOR_OPENING_TIME = 30;
	static DOOR_OPENNESS = 0.35 * WorldData.TILE_SIZE;
	static DOOR_HEIGHT = 0.2 * WorldData.TILE_SIZE;
	static DOOR_CLOSE_DELAY = 30;

	static GLOW_SIZE = 150;
	static GLOW_INTENSITY = 0.4;
	static ACCENT_WIDTH = 3;

	static PARTICLE_SPAWN_ATTEMPTS = 2;
	static PARTICLE_SPAWN_PROBABILITY = 1;
	static PARTICLE_PERPENDICULAR_OFFSET = 10;
	static PARTICLE_MIN_VELOCITY = 4.5;
	static PARTICLE_MAX_VELOCITY = 5;
	static PARTICLE_SETTINGS: ParticleSettings = {
		color: { red: 100, green: 100, blue: 100 },
		size: { min: 5, max: 10 },
		grayscaleColorVariance: 25,
		sizeDecay: 0.3,
	};
}

export class PortalData {
	// static COLOR = "rgb(30, 30, 30)";
	static COLOR = "rgb(15, 15, 15)";
	static WIDTH = 2 * WorldData.TILE_SIZE;
	static BASE_HEIGHT = 0.2 * WorldData.TILE_SIZE;
	static HITBOX_WIDTH = WorldData.TILE_SIZE;
	static HITBOX_HEIGHT = WorldData.TILE_SIZE * 2;

	static LINE_SPAWN_WIDTH = PortalData.WIDTH * 0.6;
	static LINE_SPEED = 2;
	static FRAMES_PER_LINE = 2;

	static PARTICLE_SETTINGS: ParticleSettings = {
		color: { red: 50, green: 200, blue: 255 },
		size: { min: 0.4 * WorldData.TILE_SIZE, max: 0.6 * WorldData.TILE_SIZE },
		shape: 2,
		solid: false,
		rotation: Math.PI / 2,
		opacityDecay: { min: 1/60, max: 1/40 },
		thickness: 2,
	};
}

export class SpiderData {
	static SIZE = WorldData.TILE_SIZE;
	static HITBOX_SIZE = WorldData.TILE_SIZE * 0.6;
	static COLOR = "black";
	static SPEED = 3;
	static FAST_SPEED = 8;
	static ANGULAR_SPEED = 0.2;
	static TURN_WALL_DISTANCE = 20;
	static TURN_WALL_DURATION = 20;
	static LEG_SPEED = 3;
	static LEG_UPDATE_SPEED = 2 * SpiderData.LEG_SPEED;
	static MAX_BASEPOINT_DISTANCE = 60;
	static MAX_DISTANCE_PER_MOVE = 3;
	static SKITTER_START_DISTANCE = 100;
	static SKITTER_END_DISTANCE = 200;

	static LEG_1 = {
		LENGTH: 30,
		ATTACHMENT: new Vector(13, 17),
		MIN_DISTANCE: 30,
		MAX_DISTANCE: 50,
	};
	static LEG_2 = {
		LENGTH: 40,
		ATTACHMENT: new Vector(25, 0),
		MIN_DISTANCE: 40,
		MAX_DISTANCE: 70,
	};

	static NUM_EYES = 3;
	static EYE_DISTANCE = 8;
	static EYE_SIZE = 5;
	// static EYE_COLOR = {
	// 	hue: 38,
	// 	saturation: 100,
	// 	value: 39,
	// };
	// static UNLIT_EYE_COLOR = {
	// 	hue: 30,
	// 	saturation: 0,
	// 	value: 35,
	// };
	static EYE_COLOR = "rgb(200, 128, 0)";
	static UNLIT_EYE_COLOR = "rgb(100, 100, 100)";

	static GLOW_SIZE = 100;
	static GLOW_INTENSITY = 0.4;
	static UNLIT_GLOW_INTENSITY = 0.1;
	static SHOT_DELAY = 75;
	static GLOW_COLOR = {
		red: 255,
		green: 128,
		blue: 0,
	};

	static PROJECTILE_PARTICLE_SETTINGS: ParticleSettings = {
		color: { red: 255, green: 128, blue: 0 },
		size: 10,
		shape: "circle",
		glowSize: 30,
		glowIntensity: 1/8,
		sizeDecay: 0.2,
		grayscaleColorVariance: 10,
	};
	static PROJECTILE_SPEED = 5.5;
	static PROJECTILE_ACCELERATION = 0.07;
	static RECHARGE_TIME = 60 * 3;

	static SPIDERS_PER_ROOM = 0.5;
	static SPAWN_EVENNESS = 4;
}

export class FireballData {
	static GLOW_SIZE = 150;
	static GLOW_INTENSITY = 0.4;
	static GLOW_COLOR = {
		red: 255,
		green: 150,
		blue: 50,
	};
}

export class ItemData {
	static DOWN_THROW_VELOCITY = new Vector(0, 5);
	static THROW_VELOCITY = new Vector(10, -2);
	static FRICTION_X = 0.95;
	static GROUNDED_FRICTION_X = 0.75;
	static THROW_OFFSET = 5;
	static PICKUP_DISTANCE = 10;
	static THROW_CORRECTION = 20;
	static THROW_OFFSET_Y = -6;

	static BLOCK = {
		BLOCKS_PER_ROOM: 0.3,
		BLOCKS_SPAWN_EVENNESS: 4,
		COLOR: "rgb(15, 15, 15)",
	};

	static TILE_MODIFIERS = {
		MOVING: {
			SPEED: 4,
			ACCELERATION: 0.4,
			COOLDOWN: 3,
		},
	};
}

export class PhysicsData {
	static CAN_PUSH = {
		// TODO

		// "lizard": {
		// 	"lizard": false,
		// 	"spikeball": true,
		// },
	};
}

export class HealthPickupData {
	static SIZE = WorldData.TILE_SIZE;

	static IMAGE = GraphicsUtils.loadImage("graphics/health-pickup.png", WorldData.TILE_SIZE, WorldData.TILE_SIZE);
	static HITBOX_RADIUS = 10;
}

export class TallCreatureData {
	static HEAD_WIDTH = WorldData.TILE_SIZE * 1.5;
	static HEAD_HEIGHT = WorldData.TILE_SIZE * 0.4;
	static LEG_HITBOX_WIDTH = WorldData.TILE_SIZE * 1.3;

	static LEG_ATTACHMENTS = [
		WorldData.TILE_SIZE * -1/2,
		WorldData.TILE_SIZE * -1/6,
		WorldData.TILE_SIZE * 1/6,
		WorldData.TILE_SIZE * 1/2,
	] as const;
	static LEG_LINE_WIDTH = WorldData.TILE_SIZE * 0.1;

	static SPEED = 3;
	static MAX_LEG_HEIGHT = WorldData.TILE_SIZE * 4;
	static LEG_SPEED = 2.5;
	static LEG_UPDATE_SPEED = 10;
	static MAX_LEG_OFFSET = 5;
	static MAX_STEP_SIZE = 1.1 * WorldData.TILE_SIZE;

	static EYE_COLOR = {
		red: 255,
		green: 0,
		blue: 0,
	};
	static EYE_RADIUS = 5;
	static EYE_SPACING = 20;
	static GLOW_SIZE = 100;
	static GLOW_INTENSITY = 0.4;

	static STABBING_SPEED = 25;
	static RETRACTING_SPEED = 15;
}

export class TeleportingCreatureData {
	static HITBOX_WIDTH = WorldData.TILE_SIZE * 1 - 2;
	static HITBOX_HEIGHT = WorldData.TILE_SIZE * 0.8;

	static MAX_TELEPORT_DISTANCE_Y = 2;
	static TELEPORT_LOOKBELOW_DISTANCE = 200;
	static MAX_TELEPORT_RANGE = 500;

	static TELEGRAPH_DURATION = 13;
	static FIRE_DURATION = 60;
	static COOLDOWN_DURATION = 30;

	static FIRE = {
		maxHurtboxSize: 150,
		hurtboxWidth: 1/2 * WorldData.TILE_SIZE,
		hurtboxOffset: WorldData.TILE_SIZE * 0.4,
		hurtboxSpeed: 5,
		particlesPerFrame: 2,
		particleSettings: {
			color: { red: 255, green: 128, blue: 0 },
			size: WorldData.TILE_SIZE * 0.2,
			shape: "circle",
			glowSize: 30,
			glowIntensity: 1/8,
			opacityDecay: 1/30,
			sizeDecay: (WorldData.TILE_SIZE * 0.2 / 20) * 0.8,
		} as ParticleSettings,
		particleSpeed: 6,
		particleSpeedVariance: 2,
		particleCrossSpeedVariance: 1,
		decayRate: 0.9,
	};

	static CREATURES_PER_ROOM = 1.0; // 1.3 is pretty difficult
	static SPAWN_EVENNESS = 3;

	static ZAP_WIDTH = 4;
	static ZAP_WIDTH_DECAY = 0.15;
	static ZAP_COLOR = "white";

	static GRAPHICS = {
		COLOR: "black",
		BODY_SIZE: 30,
		BODY_OFFSET_Y: -5,

		EYE_COLOR: { red: 255, green: 128, blue: 0 },
		UNLIT_EYE_COLOR: "rgb(100, 100, 100)",
		EYE_SIZE: WorldData.TILE_SIZE * 0.1,

		GLOW_SIZE: 100,
		GLOW_INTENSITY: 0.4,

		LEG_ENDPOINT_1: new Vector(5, 5),
		LEG_ENDPOINT_2: new Vector(20, 30),
		LEG_WIDTH: 5,
	};
}

export class DeathScreenData {
	static DEATH_TEXT_COLOR = "white";
	static DEATH_TEXT_FONT = "100px monospace";

	static DEATH_INFO_FONT = "30px monospace";
	static DEATH_INFO_Y_OFFSET = 100;
	static DEATH_INSTRUCTION_TEXT_Y_OFFSET = 150;

	static OVERLAY_RECT_COLOR = "rgb(25, 25, 25)";
	static OVERLAY_RECT_OPACITY = 0.85;
	static OVERLAY_RECT_TOP_OFFSET = -50;
	static OVERLAY_RECT_BOTTOM_OFFSET = 230;
	static OVERLAY_RECT_MARGIN_X = 100;

	static TIME_BEFORE_CONTINUE = 20;
}

export class WorldUIData {
	static HEALTH_COLOR = "rgb(255, 0, 0)";
	static HEALTH_BOX_SIZE = 60;
	static HEALTH_BOX_MARGIN = 15;
	static HEALTH_TEXT_FONT = "40px monospace";

	static ITEM_BOX_SIZE = 60;
	static ITEM_BOX_MARGIN = 15;
	static ITEM_BOX_COLOR = "rgb(150, 150, 150)";

	static CONTROLS_TEXT = {
		TEXT: "Arrow keys to move, Z to jump",
		FADE_SPEED: 1 / 30,
		OPACITY: 5,
		OFFSET: new Vector(0, 200),
		FONT: "30px monospace",
	};
}

export class StartScreenData {
	static BACKGROUND_COLOR = "rgb(30, 30, 30)";
	static TITLE_FONT = "100px monospace";
	static TITLE_COLOR = "white";
	static TITLE_TEXT = "Arachnomechanica";

	static INSTRUCTIONS_FONT = "30px monospace";
	static INSTRUCTIONS_COLOR = "white";
	static INSTRUCTIONS_TEXT = "Press any key to start";

	static TIME_BEFORE_CONTINUE = 30;
}

export class FirespawnerData {
	static PARTICLE_DECAY = 0.9;
}

export class ChainData {
	static COLOR = "rgb(0, 0, 0)";
	static LINE_WIDTH = 7;
	/* For chains to look nice, THIN_SEGMENT_LENGTH + THICK_SEGMENT_LENGTH should be a divisor of TILE_SIZE. */
	static NUM_SEGMENTS = 2;
	static THIN_SEGMENT_LENGTH = (WorldData.TILE_SIZE / ChainData.NUM_SEGMENTS) * 0.7;
	static THICK_SEGMENT_LENGTH = (WorldData.TILE_SIZE / ChainData.NUM_SEGMENTS) - ChainData.THIN_SEGMENT_LENGTH;


	static CLIMB_SPEED = 7;
	static CLIMB_WIDTH = 30;
	static SNAP_SPEED = 7;
}
