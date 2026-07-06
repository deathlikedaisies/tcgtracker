export function startDevTimer(label: string) {
  if (process.env.NODE_ENV !== "development") {
    return () => {};
  }

  const start = performance.now();

  return () => {
    const elapsedMs = Math.round(performance.now() - start);
    console.info(`[dev-timing] ${label}: ${elapsedMs}ms`);
  };
}
