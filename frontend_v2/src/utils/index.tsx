export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => ReturnType<T> {
  let timeout: ReturnType<typeof setTimeout> | null;
  let args: Parameters<T>;
  let context: any;
  let timestamp: number;
  let result: ReturnType<T>;

  const later = function () {
    const last = +new Date() - timestamp;

    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null!;
      }
    }
  };

  return function (this: any, ..._args: Parameters<T>): ReturnType<T> {
    context = this;
    args = _args;
    timestamp = +new Date();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null!;
    }
    return result;
  };
}
