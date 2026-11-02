const STEPS = [
  ["Tell us what you have", "Type in English, Swahili or Sheng. Nyanya and tomato are the same thing here."],
  ["We match it strictly", "You see what you can cook now, and what is one ingredient away, with the missing item named."],
  ["Cook, then pair", "Every dish suggests sides and drinks, and swaps when something runs out."],
];

export function Steps() {
  return (
    <section className="steps sec">
      <div className="wrap">
        <h2 className="h2">Three steps to dinner</h2>
        <ol>
          {STEPS.map(([title, body], i) => (
            <li key={title}>
              <b>{i + 1}</b>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
