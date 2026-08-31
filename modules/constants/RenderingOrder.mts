export const RENDERING_ORDER = [
	"backgrounds",
	"editor-background",

	"shake",
	"camera-translation",

	"glow",
	"background-entity",
	"player",
	"particle",

	"entity",
	"tile",
	"tile-accent",
	"tile-entity",
	"death-particle",

	"telegraph",
	"hitbox",

	"reset-shake",
	"reset-camera-translation",
	"overlay-text",
	"world-ui",
	"editor-ui",
	"start-screen-ui",
	"screen-fade",

	"debug-mouse-coordinates",
	"debug-fps",
] as const;

export type RenderingID = typeof RENDERING_ORDER[number];
