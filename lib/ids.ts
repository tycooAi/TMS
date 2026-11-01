export function generateId(prefix: string, sequenceNumber: number): string {
  return `${prefix}-${String(sequenceNumber).padStart(5, '0')}`;
}

export function nextSequenceNumber(existingIds: string[]): number {
  let maxSeq = 100;
  for (const id of existingIds) {
    const parts = id.split('-');
    if (parts.length === 2) {
      const num = parseInt(parts[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  return maxSeq + 1;
}

export function generateNextId(prefix: string, existingIds: string[]): string {
  return generateId(prefix, nextSequenceNumber(existingIds));
}
