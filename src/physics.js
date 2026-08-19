export const overlaps = (first, second) =>
  first.position.x < second.position.x + second.width &&
  first.position.x + first.width > second.position.x &&
  first.position.y < second.position.y + second.height &&
  first.position.y + first.height > second.position.y;

const rangesOverlap = (firstStart, firstEnd, secondStart, secondEnd) =>
  firstEnd > secondStart && firstStart < secondEnd;

const findPlatformImpact = (player, platform) => {
  const previous = player.previousPosition;
  const current = player.position;
  const platformPrevious = platform.previousPosition ?? platform.position;
  const platformDeltaX = platform.position.x - platformPrevious.x;
  const platformDeltaY = platform.position.y - platformPrevious.y;
  const deltaX = current.x - previous.x - platformDeltaX;
  const deltaY = current.y - previous.y - platformDeltaY;
  const left = platformPrevious.x;
  const right = left + platform.width;
  const top = platformPrevious.y;
  const bottom = top + platform.height;
  const impacts = [];

  if (deltaY > 0) {
    const time = (top - (previous.y + player.height)) / deltaY;
    const xAtImpact = previous.x + deltaX * time;
    if (
      time >= 0 && time <= 1 &&
      rangesOverlap(xAtImpact, xAtImpact + player.width, left, right)
    ) {
      impacts.push({ side: "top", time });
    }
  }

  if (platform.type !== "one-way" && deltaY < 0) {
    const time = (bottom - previous.y) / deltaY;
    const xAtImpact = previous.x + deltaX * time;
    if (
      time >= 0 && time <= 1 &&
      rangesOverlap(xAtImpact, xAtImpact + player.width, left, right)
    ) {
      impacts.push({ side: "bottom", time });
    }
  }

  if (platform.type !== "one-way" && deltaX > 0) {
    const time = (left - (previous.x + player.width)) / deltaX;
    const yAtImpact = previous.y + deltaY * time;
    if (
      time >= 0 && time <= 1 &&
      rangesOverlap(yAtImpact, yAtImpact + player.height, top, bottom)
    ) {
      impacts.push({ side: "left", time });
    }
  }

  if (platform.type !== "one-way" && deltaX < 0) {
    const time = (right - previous.x) / deltaX;
    const yAtImpact = previous.y + deltaY * time;
    if (
      time >= 0 && time <= 1 &&
      rangesOverlap(yAtImpact, yAtImpact + player.height, top, bottom)
    ) {
      impacts.push({ side: "right", time });
    }
  }

  return impacts.reduce(
    (earliest, impact) => earliest === null || impact.time < earliest.time ? impact : earliest,
    null
  );
};

export const resolvePlatformCollisions = (player, platforms) => {
  player.supportPlatform = null;
  for (const platform of platforms) {
    if (!platform.active) continue;
    const impact = findPlatformImpact(player, platform);
    if (!impact) continue;

    if (impact.side === "top") {
      player.position.y = platform.position.y - player.height;
      if (platform.type === "bounce") {
        player.velocity.y = -1100;
        player.isGrounded = false;
      } else {
        player.velocity.y = 0;
        player.isGrounded = true;
        player.supportPlatform = platform;
      }
      if (platform.type === "fragile") platform.active = false;
    } else if (impact.side === "bottom") {
      player.position.y = platform.position.y + platform.height;
      if (platform.type === "moving-y" && platform.movementVelocity?.y > 0) {
        player.position.y += 0.01;
        player.velocity.y = platform.movementVelocity.y + 180;
      } else {
        player.velocity.y = 0;
      }
    } else if (impact.side === "left") {
      player.position.x = platform.position.x - player.width;
      player.velocity.x = 0;
    } else if (impact.side === "right") {
      player.position.x = platform.position.x + platform.width;
      player.velocity.x = 0;
    }
  }
};

export const resolveBlockadeCollisions = (player, blockades) => {
  for (const block of blockades) {
    if (!overlaps(player, block)) continue;
    const previousRight = player.previousPosition.x + player.width;
    const previousLeft = player.previousPosition.x;
    const previousBottom = player.previousPosition.y + player.height;
    const previousTop = player.previousPosition.y;

    if (previousBottom <= block.position.y) {
      player.position.y = block.position.y - player.height;
      player.velocity.y = 0;
      player.isGrounded = true;
    } else if (previousTop >= block.position.y + block.height) {
      player.position.y = block.position.y + block.height;
      player.velocity.y = Math.max(0, player.velocity.y);
    } else if (previousRight <= block.position.x) {
      player.position.x = block.position.x - player.width;
      player.velocity.x = 0;
    } else if (previousLeft >= block.position.x + block.width) {
      player.position.x = block.position.x + block.width;
      player.velocity.x = 0;
    }
  }
};

export const findReachedCheckpoint = (player, checkpoints) => {
  const nextOrder = checkpoints.filter((checkpoint) => checkpoint.claimed).length + 1;
  return checkpoints.find((checkpoint) =>
    !checkpoint.claimed &&
    checkpoint.order === nextOrder &&
    overlaps(player, checkpoint)
  );
};
