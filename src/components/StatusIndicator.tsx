import { CircleCheck, CircleX } from "lucide-react";

function StatusIndicator({ isDone, text }: { isDone: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {isDone ? (
        <CircleCheck color="green" className="inline" />
      ) : (
        <CircleX color="red" className="inline" />
      )}
      {text}
    </div>
  );
}

export default StatusIndicator;
