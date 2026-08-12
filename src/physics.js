export const overlaps = (first, second) =>
  first.position.x < second.position.x + second.width &&
  first.position.x + first.width > second.position.x &&
  first.position.y < second.position.y + second.height &&
  first.position.y + first.height > second.position.y;

export const resolvePlatformCollisions = (player, platforms) => {
  for (const platform of platforms) {
    const previousBottom = player.previousPosition.y + player.height;
    const currentBottom = player.position.y + player.height;
    const horizontallyOverlapping =
      player.position.x + player.width > platform.position.x &&
      player.position.x < platform.position.x + platform.width;

    if (
      player.velocity.y >= 0 &&
      previousBottom <= platform.position.y &&
      currentBottom >= platform.position.y &&
      horizontallyOverlapping
    ) {
      player.position.y = platform.position.y - player.height;
      player.velocity.y = 0;
      player.isGrounded = true;
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
