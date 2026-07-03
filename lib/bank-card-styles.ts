export interface BankCardStyleFields {
  width: number;
  height: number;
  logoFontSize: number;
  logoColor: string;
  infoFontSize: number;
  infoColor: string;
  noticeFontSize: number;
  noticeColor: string;
  noticeBgColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
}

export const DEFAULT_BANK_CARD_STYLE: BankCardStyleFields = {
  width: 320,
  height: 220,
  logoFontSize: 20,
  logoColor: "hsl(var(--brand-orange))",
  infoFontSize: 24,
  infoColor: "#171717",
  noticeFontSize: 14,
  noticeColor: "#ffffff",
  noticeBgColor: "hsl(var(--brand-orange))",
  backgroundColor: "#ffffff",
  borderColor: "#171717",
  borderWidth: 2,
  borderRadius: 6,
  padding: 24,
};
