/** Sync weight from boxes for regular categories (weightPerBox is fixed). */
export function syncWeightFromBoxes(
  boxes: string,
  weightPerBox: number
): string {
  if (boxes === "") return "";
  const boxesNum = Number(boxes);
  if (boxesNum === 0) return "0";
  if (!weightPerBox || weightPerBox <= 0) return "";
  return (boxesNum * weightPerBox).toFixed(3);
}

/** Sync boxes from weight for regular categories (weightPerBox is fixed). */
export function syncBoxesFromWeight(
  weight: string,
  weightPerBox: number
): string {
  if (weight === "") return "";
  const weightNum = Number(weight);
  if (weightNum === 0) return "0";
  if (!weightPerBox || weightPerBox <= 0) return "";
  return String(Math.round(weightNum / weightPerBox));
}
