import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { WorldData } from "../constants/GameData.mjs";
import { Entity } from "../game-utilities/Entity.mjs";
import { Collideable } from "../game-utilities/physics-engine/Collideable.mjs";
import { BoundingBoxStructure } from "../game-utilities/BoundingBoxStructure.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { Diagonal, Direction } from "../../utils-ts/modules/geometry/Direction.mjs";
import { Octants } from "../game-utilities/Octant.mjs";
import { Camera } from "./Camera.mjs";
import { Renderable, Renderer } from "./Renderer.mjs";
import { GeomUtils } from "../game-utilities/GeomUtils.mjs";

export class Entities<EntityType extends Entity = Entity> extends BoundingBoxStructure<Entity, EntityType> {
	constructor(entities: Iterable<EntityType> = []) {
		super(WorldData.ENTITY_CHUNK_SIZE, (e) => e.boundingBox());

		for(const entity of entities) {
			this.add(entity);
		}
	}

	update(camera?: Camera) {
		const entities = camera ? this.possiblyIntersecting(camera.visibleRegion(WorldData.ENTITY_UPDATE_DISTANCE)) : this;
		for(const entity of entities) {
			entity.update();
		}
	}

	collideablesIntersecting(rectangle: Rectangle, collides: (collideable: Collideable) => boolean = () => true) {
		return new Set([...this.possiblyIntersecting(rectangle)].filter(
			e => e instanceof Collideable && collides(e) && e.hitboxes().some(h => h.interiorIntersects(rectangle)),
		)) as Set<unknown> as Set<Collideable>;
	}

	angularMotionBlockers(point: Vector, collides: (entity: Collideable) => boolean = () => true): (Direction | Diagonal)[] {
		const nearEntities = this.collideablesIntersecting(Rectangle.square(point.x - 1, point.y - 1, 2));
		const hitboxes = [...nearEntities].filter(collides).flatMap(e => e.hitboxes());
		return [...new Set(
			hitboxes.flatMap(h => Octants.octantsOfRect(point, h))
			.flatMap(o => [Octants.edge(o, "clockwise"), Octants.edge(o, "counterclockwise")]),
		)];
	}

	rayIntersectionDistance(position: Vector, direction: Vector, collides: (entity: Entity) => boolean = () => true, maxLength: number) {
		let result = Infinity;
		const furthestEndpoint = position.add(direction.multiply(maxLength));
		const rectangle = Rectangle.fromOppositeCorners(position, furthestEndpoint);
		for(const entity of this.possiblyIntersecting(rectangle)) {
			if(!(entity instanceof Collideable) || !collides(entity) || !entity.tangible) { continue; }
			for(const hitbox of entity.hitboxes()) {
				result = Math.min(result, GeomUtils.rayIntersectsRectangle(position, direction, hitbox));
			}
		}
		return result;
	}
	rectIntersectionDistance(rect: Rectangle, direction: Direction, maxDistance: number, collides: (entity: Collideable) => boolean) {
		const searchRegion = Rectangle.boundingBox([rect, rect.translate(Vector.unit(direction).multiply(maxDistance))]);
		const entities = this.possiblyIntersecting(searchRegion);
		const hitboxes = [...entities].filter(e => e instanceof Collideable && collides(e) && e.tangible).flatMap(e => (e as unknown as Collideable).hitboxes());
		const distances = hitboxes.map(h => GeomUtils.rectIntersectionDistance(rect, direction, h));
		return Math.min(maxDistance, ...distances);
	}

	damage(hurtbox: Rectangle, damages: (e: Entity) => boolean = () => true) {
		for(const entity of this.collideablesIntersecting(hurtbox)) {
			if(damages(entity) && entity.damageable) {
				entity.damage(hurtbox);
			}
		}
	}

	render(camera: Camera, renderer: Renderer) {
		const region = camera.visibleRegion(WorldData.ENTITY_RENDER_DISTANCE);
		for(const entity of this.possiblyIntersecting(region)) {
			for(const renderable of entity.render()) {
				renderer.renderables.push(renderable);
			}
			if(entity instanceof Collideable) {
				renderer.renderables.push(new Renderable(
					(c) => entity.displayHitboxes(c),
					"hitbox",
				));
			}
		}
	}
}
