import { JUMP_BUFFER_TIME } from "./config.js";

export class InputController {
  constructor() {
    this.left = false;
    this.right = false;
    this.jumpBufferRemaining = 0;
  }

  get hasBufferedJump() {
    return this.jumpBufferRemaining > 0;
  }

  queueJump() {
    this.jumpBufferRemaining = JUMP_BUFFER_TIME;
  }

  consumeJump() {
    this.jumpBufferRemaining = 0;
  }

  tick(deltaTime) {
    this.jumpBufferRemaining = Math.max(0, this.jumpBufferRemaining - deltaTime);
  }

  reset() {
    this.left = false;
    this.right = false;
    this.jumpBufferRemaining = 0;
  }

  bind(windowObject, touchControls = [], { onPause = () => {}, onRestart = () => {} } = {}) {
    windowObject.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "Escape"].includes(event.key) || ["a", "d", "w"].includes(key)) {
        event.preventDefault();
      }
      if (event.key === "ArrowLeft" || key === "a") this.left = true;
      if (event.key === "ArrowRight" || key === "d") this.right = true;
      if (!event.repeat && (event.key === "Escape" || key === "p")) {
        onPause();
      }
      if (!event.repeat && key === "r") onRestart();
      if (!event.repeat && (event.key === "ArrowUp" || event.key === " " || event.code === "Space" || key === "w")) {
        this.queueJump();
      }
    });

    windowObject.addEventListener("keyup", (event) => {
      const key = event.key.toLowerCase();
      if (event.key === "ArrowLeft" || key === "a") this.left = false;
      if (event.key === "ArrowRight" || key === "d") this.right = false;
    });
    windowObject.addEventListener("blur", () => this.reset());

    touchControls.forEach((button) => {
      const control = button.dataset.control;
      button.setAttribute("aria-pressed", "false");
      const press = (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        button.setAttribute("aria-pressed", "true");
        if (control === "left") this.left = true;
        if (control === "right") this.right = true;
        if (control === "jump") this.queueJump();
      };
      const release = (event) => {
        event.preventDefault();
        button.setAttribute("aria-pressed", "false");
        if (control === "left") this.left = false;
        if (control === "right") this.right = false;
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });
  }
}
