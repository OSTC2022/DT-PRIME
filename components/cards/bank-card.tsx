import { BankCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BankCardView({ card, className }: { card: BankCard; className?: string }) {
  const padding = card.padding ?? 24;

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      style={{
        width: card.width ? `${card.width}px` : undefined,
        height: card.height ? `${card.height}px` : undefined,
        backgroundColor: card.backgroundColor ?? "#ffffff",
        borderColor: card.borderColor ?? "#171717",
        borderWidth: card.borderWidth != null ? `${card.borderWidth}px` : "2px",
        borderStyle: "solid",
        borderRadius: card.borderRadius != null ? `${card.borderRadius}px` : "6px",
        padding: `${padding}px`,
        boxSizing: "border-box",
      }}
    >
      <div
        className="font-black"
        style={{
          fontSize: card.logoFontSize ? `${card.logoFontSize}px` : "20px",
          color: card.logoColor ?? "hsl(var(--brand-orange))",
        }}
      >
        {card.logoText}
      </div>
      <div className="space-y-1 leading-tight">
        <div
          className="font-bold tracking-wide"
          style={{
            fontSize: card.infoFontSize ? `${card.infoFontSize}px` : "24px",
            color: card.infoColor ?? "#171717",
          }}
        >
          {card.bankName}
        </div>
        <div
          className="font-bold tracking-wider"
          style={{
            fontSize: card.infoFontSize ? `${card.infoFontSize}px` : "24px",
            color: card.infoColor ?? "#171717",
          }}
        >
          {card.accountNumber}
        </div>
        <div
          className="font-bold tracking-wide"
          style={{
            fontSize: card.infoFontSize ? `${card.infoFontSize}px` : "24px",
            color: card.infoColor ?? "#171717",
          }}
        >
          {card.accountHolder}
        </div>
      </div>
      {card.noticeText ? (
        <div
          className="mt-1 rounded-md px-3 py-2 text-center font-bold"
          style={{
            fontSize: card.noticeFontSize ? `${card.noticeFontSize}px` : "14px",
            color: card.noticeColor ?? "#ffffff",
            backgroundColor: card.noticeBgColor ?? "hsl(var(--brand-orange))",
          }}
        >
          {card.noticeText}
        </div>
      ) : null}
    </div>
  );
}
