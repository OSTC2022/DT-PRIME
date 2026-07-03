/** 선택한 제품 시트 카드를 A4 레이아웃으로 인쇄 */
export function printProductSheetA4() {
  document.body.classList.add("printing-product-sheet-a4");

  const afterPrint = () => {
    document.body.classList.remove("printing-product-sheet-a4");
    window.removeEventListener("afterprint", afterPrint);
  };
  window.addEventListener("afterprint", afterPrint);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
    });
  });
}
