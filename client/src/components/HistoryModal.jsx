import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function HistoryModal({ open, title, data, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 p-4">
      <div className="w-full max-w-3xl rounded-[2rem] border border-sky-100/25 bg-sky-300/18 p-6 text-white shadow-card backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">History</p>
            <h3 className="font-display text-2xl text-white">{title}</h3>
          </div>
          <button
            type="button"
            className="rounded-full border border-sky-100/30 bg-white/18 px-4 py-2 text-sm font-semibold text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.map((item) => ({
                ...item,
                label: new Date(item.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#d8dee9" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#4dff9a" strokeWidth={3} dot={false} />
              <Line
                type="monotone"
                dataKey="lowerThreshold"
                name="Lower threshold"
                stroke="#ff5f7a"
                strokeDasharray="6 4"
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="upperThreshold"
                name="Upper threshold"
                stroke="#ffd84d"
                strokeDasharray="6 4"
                dot={false}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
