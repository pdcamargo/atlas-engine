export class AnimationFrameChangedEvent {
  constructor(
    public readonly animatedSprite: import("./components").AnimatedSprite,
    public readonly newFrameIndex: number,
    public readonly newFrame: import("./components").AnimationFrame
  ) {}
}

export class AnimationFinishedEvent {
  constructor(
    public readonly animatedSprite: import("./components").AnimatedSprite
  ) {}
}
