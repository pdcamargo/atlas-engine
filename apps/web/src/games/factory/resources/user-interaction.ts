import { PlacedMetadata } from "./world-grid";

export class UserInteractionState {
  public hoveredTile: { x: number; y: number } | null = null;
  public hoveredMetadata: PlacedMetadata | null = null;
}
