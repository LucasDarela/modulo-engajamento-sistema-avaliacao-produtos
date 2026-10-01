import "server-only";

import bcrypt from "bcrypt";

const COST = 12;

// Hash bcrypt válido (custo 12) de uma senha aleatória descartada. Usado quando o
// email não existe, para o tempo de resposta ser igual ao de uma senha errada.
export const DUMMY_PASSWORD_HASH =
  "$2b$12$axtGGWZLszqADjf2dE235ul.yHHPUNEP0CoPzqHm.cBB8g.E3nPCq";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(COST);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
