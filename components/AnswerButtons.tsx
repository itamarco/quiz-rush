"use client";

interface AnswerButtonsProps {
  options: string[];
  onAnswer: (index: number) => void;
  disabled?: boolean;
  selectedAnswer?: number | null;
  showCorrect?: boolean;
  correctIndex?: number;
}

export default function AnswerButtons({
  options,
  onAnswer,
  disabled = false,
  selectedAnswer = null,
  showCorrect = false,
  correctIndex,
}: AnswerButtonsProps) {
  const getButtonColor = (index: number) => {
    const colors = ["#FFE66D", "#FF6B9D", "#4ECDC4", "#95E1D3"];
    const baseColor = colors[index % colors.length];

    if (disabled && showCorrect && correctIndex !== undefined) {
      if (index === correctIndex) return { bg: "#95E1D3", text: "black" };
      if (index === selectedAnswer && index !== correctIndex)
        return { bg: "#FF6B6B", text: "black" };
      return { bg: "#E0E0E0", text: "gray-600" };
    }
    if (selectedAnswer === index) return { bg: baseColor, text: "black" };
    return { bg: baseColor, text: "black" };
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {options.map((option, index) => {
        const color = getButtonColor(index);
        return (
          <button
            key={index}
            onClick={() => !disabled && onAnswer(index)}
            disabled={disabled}
            className={`brutal-button p-6 text-start ${
              disabled ? "cursor-not-allowed opacity-75" : "cursor-pointer"
            }`}
            style={{ backgroundColor: color.bg }}
          >
            <div className="mb-2 text-sm font-black">
              {String.fromCharCode(65 + index)}
            </div>
            <div className="text-lg font-bold text-black">{option}</div>
          </button>
        );
      })}
    </div>
  );
}
