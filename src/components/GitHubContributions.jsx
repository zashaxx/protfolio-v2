import { useEffect, useState } from "react";

const githubUsername = "zashaxx";
const contributionApi = `https://github-contributions-api.jogruber.de/v4/${githubUsername}?y=last`;
const levelRadii = [1.1, 2.7, 3.8, 4.8, 5.7];

const toUtcDate = (date) => new Date(`${date}T00:00:00Z`);

const buildWeeks = (contributions) => {
  if (!contributions.length) {
    return [];
  }

  const paddedDays = [
    ...Array(toUtcDate(contributions[0].date).getUTCDay()).fill(null),
    ...contributions,
  ];

  while (paddedDays.length % 7 !== 0) {
    paddedDays.push(null);
  }

  const weeks = [];
  for (let index = 0; index < paddedDays.length; index += 7) {
    weeks.push(paddedDays.slice(index, index + 7));
  }

  return weeks.slice(-53);
};

export default function GitHubContributions() {
  const [contributions, setContributions] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    const loadContributions = async () => {
      try {
        const response = await fetch(contributionApi, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Contribution request failed with ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.contributions) || data.contributions.length === 0) {
          throw new Error("Contribution response did not contain calendar data");
        }

        const contributionTotal = data.contributions.reduce(
          (sum, day) => sum + Number(day.count || 0),
          0,
        );

        setContributions(data.contributions);
        setTotal(Number(data.total?.lastYear ?? contributionTotal));
        setStatus("ready");
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus("error");
        }
      }
    };

    void loadContributions();
    return () => controller.abort();
  }, []);

  const weeks = buildWeeks(contributions);

  return (
    <section className="github-section" id="github" data-section>
      <div className="preview-heading" data-reveal>
        <h2>05 &mdash; github</h2>
        <a
          href={`https://github.com/${githubUsername}`}
          target="_blank"
          rel="noreferrer"
        >
          @{githubUsername} <span aria-hidden="true">{"\u2197"}</span>
        </a>
      </div>

      {status === "loading" && (
        <p className="contribution-state" role="status">
          Loading contribution activity...
        </p>
      )}

      {status === "error" && (
        <p className="contribution-state" role="status">
          Contribution activity is temporarily unavailable.
        </p>
      )}

      {status === "ready" && (
        <div className="contribution-strip">
          <a
            href={`https://github.com/${githubUsername}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`${total} GitHub contributions in the last year`}
          >
            <svg
              viewBox="0 0 689 91"
              role="img"
              aria-label="GitHub contribution graph, halftone style"
              preserveAspectRatio="xMidYMid meet"
            >
              {weeks.flatMap((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  if (!day) {
                    return null;
                  }

                  const level = Math.min(
                    4,
                    Math.max(0, Number(day.level || 0)),
                  );

                  return (
                    <circle
                      key={day.date}
                      cx={weekIndex * 13 + 6.5}
                      cy={dayIndex * 13 + 6.5}
                      r={levelRadii[level]}
                      opacity={level === 0 ? 0.12 : 0.92}
                    />
                  );
                }),
              )}
            </svg>
          </a>
          <p>{total.toLocaleString()} contributions in the last year</p>
        </div>
      )}
    </section>
  );
}
