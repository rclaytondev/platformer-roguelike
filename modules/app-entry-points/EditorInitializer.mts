import "./Initializer.mjs";
import { Debug } from "../game-utilities/Debug.mjs";
import { Main } from "../Main.mjs";
import { RoomEditor } from "../RoomEditor.mjs";
import { Room } from "../level-generator/Room.mjs";
import { WorldPart } from "../world-generator/WorldPart.mjs";
import { Tiles } from "../world/Tiles.mjs";
import { Grid } from "../../utils-ts/modules/Grid.mjs";

Main.screen = new RoomEditor(new Room(
	"editor-room",
	"editor-room",
	new WorldPart(new Tiles(), []),
	new Grid("none"),
	() => true,
	[],
	[],
));
Debug.initializeEditor();
