# List of Ideas
## Enemy Ideas
- [x] Lizard enemy that moves in a straight line and turns left or right when it hits a wall or sees the player, and breathes fire if you're in front of it
- [x] Spider enemy that crawls along walls, floors, and ceilings.
	- Attack: when it sees you, it shoots a projectile, and then runs away (perhaps only until its attack recharges).
- [ ] Tall walker enemy with long legs (inspired by Rain Deer and those desert creatures in the Watcher): it keeps its head at a constant height regardless of the floor below it, so its legs change in length as the floor height varies.
	- Attack: when in the same row, it stabs a pointy arm horizontally at you and then retracts.
	- Possible cool interaction: if it encounters another such creature, it steps up on top of the other one to form a stack of 2 creatures. The creatures remain stacked until they encounter a low ceiling which will push the upper one off.
		- This is difficult to implement, but could be worth it because the behavior is super cool.
	- Possible cool interaction: if one of the tall creatures would stab another, it instead doesn't. (Otherwise they would kill each other quickly).
- [ ] Jumping / gliding enemy
	- The movement would be like this: it would jump straight up and then glide at a shallow angle (rapid-firing projectiles straight down if you are below it). When it hits a wall it would fall straight down (possibly swapping directions if it's next to a wall) and then the pattern repeats.
	- The projectiles could break tiles because enemies that break tiles allow for exploitation, which is good.
	- Graphics: originally I imagined it being bird-themed, but I couldn't think of a way to make that work. So instead perhaps it could be a crab-like or insect-like creature (to match the other enemies' themes) that is not based off of any real-world creature. It could have a mouth-like or barrel-like shape at the bottom that the projectiles come out of.
- [x] Teleporting enemy
	- Possible mechanics idea:
		- When the enemy gains line-of-sight, it goes into "watching mode" (e.g. indicated by it's eye lighting up).
		- While in "watching mode", when the enemy loses line-of-sight, it teleports behind you and enters "preparing-to-fire mode" (e.g. indicated by it extending blaster barrels in each firing direction).
		- While in "preparing-to-fire mode", if the player jumps on the enemy, it cancels the attack for some time.
			- E.g. it could go into "passive mode" until the player loses line-of-sight, at which point it returns to its original state.
		- After being in "preparing-to-fire mode" for a few seconds without the player cancelling its attack, it begins shooting devastating projectiles left/right/up for a few seconds and then returns to its initial state.
		- The projectiles ("type 1 projectiles") travel in the four cardinal directions and launch other smaller projectiles ("type 2 projectiles") in perpendicular directions. The "type 1 projectiles" destroy a tile upon collision.
	- I should make the "type 2 projectiles" small enough that the player can fit in between the gaps in the firing pattern.
	- Possible graphics idea: the enemy could fit in a 1x1 tile, and be shaped like an equilateral triangle (pointing up or down). It could have 2 (or 3?) small stick-like legs at the bottom (these would be more like a tripod stand since it doesn't need to walk). It could have blasters on the left and right that extend when it's about to fire.
		- It could have a button on top to indicate that something happens if you jump on it. (But this kind of conflicts with the idea of it having a blaster on top, so maybe it should only shoot horizontally?)
		- I could make the "type 2 projectiles" the same as the spikeballs, and could make the enemy's eye color and glow color red. This could add consistency (since it's the same theme as the spikeballs) but also variety (since now there would be an enemy that uses the red aesthetic).

## Incomplete Enemy Ideas
- [ ] Some kind of creature that only moves when you move
	- It has to have really dangerous attacks or else it will be very easy.
	- Idea: this could be a trap instead of an enemy, and it could be merged with the extended-spinning-blade trap that I decided was too much like lizards.
	- This could work well with a trap that freezes you in place (like paincones), unless that makes it too easy.
- [ ] Four-legged wolf-like creature with an humanoid rider? (Ideally they would be able to function separately or together)

## Trap Ideas
- [x] Spikeball trap that shoots spikeballs at 45 degrees; they bounce off floors, walls, and ceilings
- [x] Spinning lasers
- [ ] Lightning trap that spreads to adjacent tiles
	- It could have the following behavior: when the player is facing in the direction of the trap, it increases the extent of the lightning (by having it spread to adjacent tiles, like growing leaves of a tree); otherwise, it decreases the extent.
	- This is good because so far I have nothing that interacts with facing direction. This could also add some directional input density, which would be great.
	- Graphics: I could make the lightning yellow, and change the laser trap's activated color to yellow. This would look good (probably) and would establish a consistent rule (yellow lightning kills you but green lasers don't).
- [ ] Projectile trap whose projectiles move in a Hilbert curve
	- It could function as follows: each trap has a fixed path (a Hilbert curve, but stopped when it hits a wall), or potentially up to 4 paths (one in each firing direction). When the player intersects the path, the path is shown briefly (e.g. with a brief flash of a line showing the path) and then a projectile is launched that travels along the path.
	- I like having projectiles that break blocks, but in this case the player has no control over where the projectile lands, so I think that this particular one should not break blocks.
	- I seem to have established that enemies break blocks and traps don't, so this is a further reason why this should be a trap and not an enemy.

## Unfinished Trap Ideas
- [ ] Liquids? (Seems hard)
- [ ] Spikes? (not very exciting)
- [ ] Device that extends out a spinning blade that moves in a straight line towards you if you're in the same row or column, and extends another if you are in the same row or column as that, and so on. If it doesn't "see" you then it retracts back.
	- Mechanically this is the same as an infinitely-long lizard with contact damage, that retracts if it doesn't see you.
	- Problem: this is too similar to the lizard enemy. There would be too many hazards that activate if they see you in the same row or column; I would want a different pattern.
	- This is similar to the lightning trap idea above.
- [ ] Device that shoots a laser that moves in a straight line orthogonally and splits into two lasers in perpendicular directions when it hits a wall, up to 2 times
- [ ] Trapped floor (multiple tiles wide): if you stand on it, the ceiling collapses on you (and stays on the floor when collapsed, like falling tiles in Minecraft)

## Non-Trap Tile Ideas
- [x] Doors such that whenever you go through one, all the doors toggle whether they're open
- [x] One way platforms (a platformer game essential)
- [x] Slopes? (they might look cool on the corners and prevent it from looking like minecraft)
- [ ] Portals? (They're cool)
- [ ] Ladders? (not sure... too much like Spelunky) (ok, that's dumb, ladders are just a basic concept in games)
- [ ] Blocks such that when you step on one of them, all others extend/retract (kind of similar to gates so they should go in an area without gates)

# Pairings of Enemies
In the following notes, "scale" refers to how much movement is needed to avoid an enemy's attack. For example, I consider lizards to be "large-scale" because their explosion is quite large, whereas I consider the teleporting creatures to be "small-scale" because their attack can be dodged by just stepping to the side. Note that large-scale does not just mean more dangerous - it has to do with the way in which you dodge the attack, not how hard it is to do so. I think it is good to pair large-scale enemies and small-scale enemies together, though I think multiple small-scale enemies works too. The important thing is to avoid having multiple large-scale enemies together.

| Combination                        | Pros                                                                                                                | Cons                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Lizards + spiders                  | Both medium-scale                                                                                                   | -                                                                                   |
| Lizards + lasers                   | -                                                                                                                   | -                                                                                   |
| Lizards + spikeballs               | -                                                                                                                   | Spikeballs cause chaotic lizard behavior and tile destruction                       |
| Lizards + teleporting creatures    | -                                                                                                                   | -                                                                                   |
| Spiders + lasers                   | -                                                                                                                   | -                                                                                   |
| Spiders + spikeballs               | -                                                                                                                   | Spikeballs cut off line of sight, leading to unpredictable spider attack timing     |
| Spiders + teleporting creatures    | Spiders large-scale and teleporting creatures small-scale                                                           | Spiders can easily blow up teleporting creatures after they teleport underneath you |
| Lasers + spikeballs                | -                                                                                                                   | No way to destroy tiles                                                             |
| Lasers + teleporting creatures     | Lasers medium-scale and teleporting creatures small-scale                                                           | -                                                                                   |
| Spikeballs + teleporting creatures | Spikeballs can sometimes stall progress, which is problematic with time-based obstacles (not teleporting creatures) |                                                                                     |
