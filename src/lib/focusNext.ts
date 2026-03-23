/**
 * @see https://www.xjavascript.com/blog/focus-next-element-in-tab-index/#identifying-focusable-elements
 */

const focusableSelectors = [
  "a[href]:not([disabled])",
  "area[href]:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  '[tabindex]:not([tabindex="-1"]):not([disabled])', // Exclude tabindex="-1"
  '[contenteditable="true"]:not([disabled])',
].join(", ");

function isVisible(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    el.offsetParent !== null && // Not hidden via display: none
    getComputedStyle(el).visibility !== "hidden" &&
    el.getAttribute("aria-hidden") !== "true"
  );
}

function tabIndexOrdering(a: HTMLElement, b: HTMLElement) {
  // Sort positive tabindexes by numeric value
  if (a.tabIndex !== b.tabIndex) {
    return a.tabIndex - b.tabIndex;
  }

  // Same tabindex? Use DOM order (compare document position)
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING
    ? 1
    : -1;
}

export default function focusNext() {
  // Step 1: Collect and filter focusable elements
  const focusableElements = Array.from<HTMLElement>(
    document.querySelectorAll(focusableSelectors),
  ).filter(isVisible);

  // Step 2: Sort by tab order
  const sortedElements = focusableElements.sort(tabIndexOrdering);

  // Step 3: Find current focused element
  const currentFocused = document.activeElement as HTMLElement;
  const currentIndex = sortedElements.indexOf(currentFocused);

  // Step 4: Determine next index (wrap around if needed)
  const nextIndex =
    currentIndex === sortedElements.length - 1 ? 0 : currentIndex + 1;

  // Step 5: Focus the next element
  return sortedElements[nextIndex]?.focus();
}
