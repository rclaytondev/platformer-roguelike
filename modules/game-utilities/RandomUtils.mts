import { ArrayUtils } from "../../utils-ts/modules/core-extensions/ArrayUtils.mjs";
import { Rectangle } from "../../utils-ts/modules/geometry/Rectangle.mjs";
import { Vector } from "../../utils-ts/modules/geometry/Vector.mjs";
import { MathUtils } from "../../utils-ts/modules/math/MathUtils.mjs";

type RandomEvenlySpacedOptions<T> = {
	generate: () => T,
	metric: (v1: T, v2: T) => number,
	amount: number,
	trials: number,
	previousPoints?: T[]
};

export class RandomUtils {
	static randomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	static random(min: number, max: number) {
		return Math.random() * (max - min) + min;
	}
	static randomPermutation<T>(items: T[]) {
		items = [...items];
		const result = [];
		while(items.length > 0) {
			const index = ArrayUtils.randomIndex(items);
			result.push(items[index]);
			items.splice(index, 1);
		}
		return result;
	}
	static weightedRandom<T>(items: T[], weights: number[]) {
		if(weights.every(w => w === 0)) {
			return ArrayUtils.randomItem(items);
		}

		const sum = MathUtils.sum(weights);
		const randomValue = RandomUtils.random(0, sum);
		let partialSum = 0;
		for(let i = 0; i < items.length; i ++) {
			partialSum += weights[i];
			if(partialSum >= randomValue) {
				return items[i];
			}
		}
		throw new Error("Unexpected: unreachable code reached in weightedRandom.");
	}
	static randomInCircle(centerX: number, centerY: number, radius: number) {
		const angle = RandomUtils.random(0, 360);
		const distance = Math.sqrt(Math.random()) * radius;
		return new Vector(centerX, centerY).add(new Vector(0, distance).rotate(angle));
	}
	static randomWithMagnitude(magnitude: number) {
		const angle = RandomUtils.random(0, 2 * Math.PI);
		return new Vector(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
	}
	static randomInRect(rectangle: Rectangle, random: (min: number, max: number) => number = RandomUtils.random) {
		return new Vector(
			random(rectangle.left, rectangle.right),
			random(rectangle.top, rectangle.bottom),
		);
	}
	static randomEvenlySpaced<T>(options: RandomEvenlySpacedOptions<T>) {
		const result: T[] = [];
		while(result.length < options.amount) {
			const candidates = new Array(options.trials).fill(0).map(options.generate);
			const previous = [...result, ...(options.previousPoints ?? [])];
			if(previous.length === 0) {
				result.push(candidates[0]);
			}
			else {
				result.push(ArrayUtils.maxValue(
					candidates,
					point => ArrayUtils.minOutput(previous, p => options.metric(point, p))),
				);
			}
		}
		return result;
	}
}
