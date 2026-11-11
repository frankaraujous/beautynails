import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      type="button"
      onClick={() => setCount((value) => value + 1)}
      className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-slate-950"
    >
      Isla React: {count}
    </button>
  );
}
