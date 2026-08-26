export const DEBUG_SETTINGS = {
	SHOW_FRAMERATE: true,
	SHOW_MOUSE_COORDINATES: true,
	HITBOX_COLOR: "rgb(0, 128, 255, 0)",

	EDITOR: {
		UI_COLOR: "rgb(255, 150, 0)",
		ROOM: null as string | number | null,
		EXIT_TILE_COLOR: "rgb(0, 200, 0)",
		HOVERED_TILE_COLOR: "rgb(0, 0, 0)",
		LOG_KEY: "Enter",
	},

	RNG: {
		LOG_KEY: "KeyR" as string | null,
		OVERRIDE_VALUES: [],
	},
	INPUT_RECORD: [
		{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true}, {"ArrowRight":true,"KeyZ":true}, {"ArrowRight":true,"KeyZ":true}, {"ArrowRight":true,"KeyZ":true}, {"ArrowRight":true,"KeyZ":true}, {"ArrowRight":true,"KeyZ":true}, {"ArrowRight":true,"KeyZ":true}, {"ArrowRight":true,"KeyZ":true}, {}, {}, {}, {}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true,"KeyZ":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {"ArrowLeft":true}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {"KeyR":true}, {"KeyR":true}, {"KeyR":true}, {"KeyR":true},
	] as { [key: string]: boolean }[],

	SPIDERS: {
		VISUALIZE: false,
	},

	LIZARDS: {
		LOOKAHEAD_COLOR: "rgb(255, 0, 0, 0)",
		HURTBOX_COLOR: "rgba(255, 0, 255, 0)",
		JOINT_COLOR: "rgba(255, 150, 0, 0)",
	},

	FREE_CAMERA_MODE: {
		ENABLED: true,
		SPEED: 20,
	},

	GENERATOR_VISUALIZATION: {
		ENABLED: false,
		GRID_SIZE: 100,
		BORDER_SIZE: 10,
		GRID_COLOR: "rgb(0, 128, 255)",

		ROOM_FREQUENCY_TRIALS: 0,
	},
};
