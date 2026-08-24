const QUOTES = [
  "Done is better than perfect.",
  "Consistency beats intensity.",
  "Ideas are cheap. Shipping is everything.",
  "Your future audience is waiting on today's post.",
  "Small daily reps compound into a body of work.",
  "The algorithm rewards the people who show up.",
  "Make the thing. Then make the next thing.",
  "Every creator's best work started as a rough idea.",
  "Momentum is built one upload at a time.",
  "You don't find time to create, you make it.",
];

export function quoteOfTheDay(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
