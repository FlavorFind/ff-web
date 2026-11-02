import { Stats } from "./stats";

export function Trust() {
  return (
    <section className="trust sec">
      <div className="wrap">
        <h2 className="h2">Tomato means tomato.</h2>
        <p className="lead text-cream/80">
          Type tomato and you get dishes that need only tomato. Never a chicken stew in disguise. Want more? Switch to
          Explore and see what’s one ingredient away.
        </p>
        <div className="cmp">
          <div className="no">
            <h3>Most recipe sites, for “tomato”</h3>
            <ul>
              <li>Chicken tomato stew</li>
              <li>Beef and tomato pie</li>
              <li>Pasta pomodoro</li>
            </ul>
          </div>
          <div className="yes">
            <h3>Flavor Find, strict mode</h3>
            <ul>
              <li>Tomato soup, exact</li>
              <li>Kachumbari, one onion away in Explore</li>
            </ul>
          </div>
        </div>
        <Stats />
      </div>
    </section>
  );
}
