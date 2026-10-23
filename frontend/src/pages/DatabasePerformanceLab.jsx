
import { Database, Gauge, Clock3, TrendingDown, Info } from "lucide-react";
import "../styles/database-performance-lab.css";

const rawExecution = 0.560;
const aggregateExecution = 0.158;
const improvement = ((rawExecution - aggregateExecution) / rawExecution) * 100;

const benchmarks = [
  {
    label: "Raw aggregation",
    description: "Aggregate readings directly from meter_reading",
    execution: rawExecution,
    planning: 5.977,
  },
  {
    label: "Continuous aggregate",
    description: "Read precomputed results from meter_reading_daily",
    execution: aggregateExecution,
    planning: 3.948,
  },
];

export default function DatabasePerformanceLab() {
  return (
    <main className="performance-page">
      <header className="performance-header">
        <div>
          <div className="performance-eyebrow">
            GRIDFLOW / DATABASE INTELLIGENCE
          </div>
          <h1>Database Performance Lab</h1>
          <p>
            Compare raw time-series aggregation with TimescaleDB continuous
            aggregates using the recorded benchmark.
          </p>
        </div>
        <div className="performance-header-icon">
          <Database size={26} />
        </div>
      </header>

      <section className="performance-kpis">
        <article className="performance-card">
          <span><Clock3 size={17} /> Raw execution time</span>
          <strong>{rawExecution.toFixed(3)} ms</strong>
          <small>Aggregation from raw readings</small>
        </article>

        <article className="performance-card">
          <span><Gauge size={17} /> Aggregate execution time</span>
          <strong>{aggregateExecution.toFixed(3)} ms</strong>
          <small>Read from precomputed daily data</small>
        </article>

        <article className="performance-card performance-highlight">
          <span><TrendingDown size={17} /> Execution-time reduction</span>
          <strong>{improvement.toFixed(1)}%</strong>
          <small>Calculated from the recorded execution times</small>
        </article>
      </section>

      <section className="performance-panel">
        <div className="performance-section-heading">
          <div>
            <h2>Execution time comparison</h2>
            <p>Lower execution time is better.</p>
          </div>
          <span className="performance-unit">Milliseconds</span>
        </div>

        {benchmarks.map((benchmark) => (
          <div className="benchmark-row" key={benchmark.label}>
            <div className="benchmark-label">
              <strong>{benchmark.label}</strong>
              <span>{benchmark.description}</span>
            </div>
            <div className="benchmark-track">
              <div
                className={`benchmark-bar ${
                  benchmark.label === "Continuous aggregate"
                    ? "benchmark-bar-fast"
                    : ""
                }`}
                style={{
                  width: `${(benchmark.execution / rawExecution) * 100}%`,
                }}
              />
            </div>
            <strong className="benchmark-value">
              {benchmark.execution.toFixed(3)} ms
            </strong>
          </div>
        ))}
      </section>

      <section className="performance-panel">
        <div className="performance-section-heading">
          <div>
            <h2>Recorded benchmark details</h2>
            <p>Values supplied by the database team.</p>
          </div>
        </div>

        <div className="performance-table-wrap">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Measurement</th>
                <th>Raw query</th>
                <th>Continuous aggregate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Planning time</td>
                <td>5.977 ms</td>
                <td>3.948 ms</td>
              </tr>
              <tr>
                <td>Execution time</td>
                <td>0.560 ms</td>
                <td>0.158 ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="performance-note">
        <Info size={19} />
        <div>
          <strong>How to interpret this result</strong>
          <p>
            A continuous aggregate stores precomputed time-bucket summaries.
            Reading those summaries can avoid aggregating every raw reading
            again. This benchmark used only 30 readings across 10 meters,
            covering January–March 2025. The result demonstrates this test
            case only; larger datasets and repeated controlled tests are
            needed to establish production-scale performance.
          </p>
        </div>
      </section>

      <section className="performance-panel">
        <div className="performance-section-heading">
          <div>
            <h2>Continuous aggregate schema</h2>
            <p>Fields available in meter_reading_daily</p>
          </div>
        </div>
        <div className="performance-fields">
          {[
            "bucket",
            "meter_id",
            "reading_count",
            "avg_reading_value",
            "min_reading_value",
            "max_reading_value",
          ].map((field) => (
            <code key={field}>{field}</code>
          ))}
        </div>
      </section>
    </main>
  );
}
