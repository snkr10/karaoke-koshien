// チーム分けロジック（design.md 7章）
// 1. 有効な参加者をランダムにシャッフルし、2人ずつに分割
// 2. 奇数の場合、余った1人は自動でソロ扱い
// 3. 直前ラウンドのペア組み合わせと1組でも重複していたら再シャッフル
// 4. 再シャッフルが20回失敗する場合、重複ペアを1組だけ強制的に組み替えるフォールバックを実施

export type Group = string[]; // 1人=ソロ, 2人=ペア

const MAX_SHUFFLE_ATTEMPTS = 20;

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function toGroups(ids: string[]): Group[] {
  const groups: Group[] = [];
  for (let i = 0; i < ids.length; i += 2) {
    if (i + 1 < ids.length) {
      groups.push([ids[i], ids[i + 1]]);
    } else {
      groups.push([ids[i]]);
    }
  }
  return groups;
}

function pairKey(pair: Group): string | null {
  if (pair.length !== 2) return null;
  return [...pair].sort().join("::");
}

function hasDuplicatePair(groups: Group[], previousPairKeys: Set<string>): boolean {
  return groups.some((g) => {
    const key = pairKey(g);
    return key !== null && previousPairKeys.has(key);
  });
}

export function makeTeamPairs(participantIds: string[], previousPairs: Group[]): Group[] {
  const previousPairKeys = new Set(
    previousPairs.map(pairKey).filter((k): k is string => k !== null)
  );

  let groups = toGroups(shuffle(participantIds));

  let attempts = 1;
  while (hasDuplicatePair(groups, previousPairKeys) && attempts < MAX_SHUFFLE_ATTEMPTS) {
    groups = toGroups(shuffle(participantIds));
    attempts++;
  }

  if (hasDuplicatePair(groups, previousPairKeys)) {
    // フォールバック: 重複しているペアを1組だけ見つけ、他のペアの1人と入れ替える
    const dupIndex = groups.findIndex((g) => {
      const key = pairKey(g);
      return key !== null && previousPairKeys.has(key);
    });
    if (dupIndex !== -1 && groups[dupIndex].length === 2) {
      const otherPairIndex = groups.findIndex((g, i) => i !== dupIndex && g.length === 2);
      if (otherPairIndex !== -1) {
        const a = groups[dupIndex];
        const b = groups[otherPairIndex];
        // aの2人目とbの1人目を入れ替える
        const newA = [a[0], b[0]];
        const newB = [a[1], b[1]];
        groups[dupIndex] = newA;
        groups[otherPairIndex] = newB;
      }
    }
  }

  return groups;
}
