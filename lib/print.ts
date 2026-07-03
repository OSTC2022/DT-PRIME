/** 브라우저 인쇄 대화상자 열기 */
export function printPage(options?: { onlyIds?: string[] }) {
  const cleanup: (() => void)[] = [];

  if (options?.onlyIds?.length) {
    document.body.classList.add("printing-filtered");
    document.querySelectorAll("[data-print-card]").forEach((card) => {
      const id = card.getAttribute("data-print-card");
      if (id && options.onlyIds!.includes(id)) {
        card.classList.add("print-include");
      }
    });
    cleanup.push(() => {
      document.body.classList.remove("printing-filtered");
      document.querySelectorAll(".print-include").forEach((el) => el.classList.remove("print-include"));
    });
  }

  const afterPrint = () => {
    cleanup.forEach((fn) => fn());
    window.removeEventListener("afterprint", afterPrint);
  };
  window.addEventListener("afterprint", afterPrint);
  window.print();
}

/** 단일 카드만 인쇄 */
export function printCard(element: HTMLElement) {
  element.classList.add("print-include");
  document.body.classList.add("printing-single");

  const afterPrint = () => {
    element.classList.remove("print-include");
    document.body.classList.remove("printing-single");
    window.removeEventListener("afterprint", afterPrint);
  };
  window.addEventListener("afterprint", afterPrint);
  window.print();
}

export function printCardById(cardId: string) {
  const el = document.querySelector(`[data-print-card="${cardId}"]`) as HTMLElement | null;
  if (el) printCard(el);
}
