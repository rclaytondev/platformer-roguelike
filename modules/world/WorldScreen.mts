import { CanvasIO } from "../../utils-ts/modules/CanvasIO.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Backgrounds } from "../backgrounds/Backgrounds.mjs";
import { GearsBackground } from "../backgrounds/GearsBackground.mjs";
import { SkyBackground } from "../backgrounds/SkyBackground.mjs";
import { PlayerData } from "../constants/GameData.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { FadeType, ScreenFade } from "../game-utilities/visual-effects/ScreenFade.mjs";
import { VisualEffects } from "../game-utilities/visual-effects/VisualEffects.mjs";
import { WorldUI } from "../user-interface/WorldUI.mjs";
import { Camera } from "./Camera.mjs";
import { Renderable, Renderer } from "./Renderer.mjs";
import { World } from "./World.mjs";

export class WorldScreen {
	world: World;
	worldUI: WorldUI = new WorldUI();
	backgrounds: Backgrounds = new Backgrounds([
		GearsBackground.generate(),
		new SkyBackground(),
	]);
	camera: Camera;
	visualEffects: VisualEffects = new VisualEffects();

	constructor(world: World, canvasIO: CanvasIO) {
		this.world = world;
		this.world.worldScreen = this;
		this.camera = new Camera(new Vector(0, 0), canvasIO);
		this.initializeCamera();
	}

	update(canvasIO: CanvasIO) {
		this.world.update(canvasIO, this.camera);
		this.camera.update(this.world.player.hitbox.center(), this.world.entities);
		this.visualEffects.update();
		this.backgrounds.update();
		Debug.updateInputRecord(canvasIO);
	}

	render(canvasIO: CanvasIO, renderer: Renderer) {
		renderer.renderables.push(new Renderable(
			() => this.backgrounds.display(canvasIO, this.camera),
			"backgrounds",
		));
		this.world.render(canvasIO, this.camera, renderer);
		this.visualEffects.render(renderer);
		renderer.renderables.push(new Renderable(
			() => this.worldUI.display(this.world, canvasIO),
			"world-ui",
		));
	}

	resetWorld() {
		this.world = new World(true);
		this.world.worldScreen = this;
		this.initializeCamera();
	}
	initializeCamera() {
		this.camera.position = this.world.player.hitbox.center();
	}
	beginDeathTransition() {
		const delay = new ScreenFade(PlayerData.DEATH_RESET_DELAY, 0, 0, "black", "transition-start-delay");
		const fadeOut = new ScreenFade(PlayerData.FADE_DURATION, 0, 1, "black", "transition-fade-out");
		const pause = new ScreenFade(PlayerData.FADE_DELAY, 1, 1, "black", "transition-pause", () => this.resetWorld());
		const fadeIn = new ScreenFade(PlayerData.FADE_DURATION, 1, 0, "black", "transition-fade-in");
		this.visualEffects.effectsList.add(ScreenFade.sequence([delay, fadeOut, pause, fadeIn], this.visualEffects));
	}
	isTransitioning() {
		const types: FadeType[] = ["transition-start-delay", "transition-fade-out", "transition-pause", "transition-fade-in"];
		return this.world.staticEntities.entitiesList.some(e => (e instanceof ScreenFade && types.includes(e.type)));
	}
}
