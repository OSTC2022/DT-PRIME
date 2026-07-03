import { BankCard } from "./types";
import { DEFAULT_BANK_CARD_STYLE } from "./bank-card-styles";

export type BankCardDemoData = Omit<BankCard, "id">;

export const DEFAULT_BANK_CARD_DEMO: BankCardDemoData = {
  ...DEFAULT_BANK_CARD_STYLE,
  logoText: "동큰+",
  bankName: "경남은행",
  accountNumber: "9216-9214",
  accountHolder: "최태환",
  noticeText: "이체 후 직원에게 꼭 말씀해 주세요!",
};

export function resolveBankCardDemo(partial?: Partial<BankCardDemoData> | null): BankCardDemoData {
  return { ...DEFAULT_BANK_CARD_DEMO, ...partial };
}

export function demoToBankCard(demo: BankCardDemoData): BankCard {
  return { id: "demo", ...demo };
}
