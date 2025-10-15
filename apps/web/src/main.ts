import { SlayGamePlugin } from "./games/slay";
import "./style.css";

import { App, DebugPlugin } from "@atlas/engine";

async function main() {
  await App.create().addPlugins(new SlayGamePlugin(), new DebugPlugin()).run();

  console.log("App finished");
}

void main();
