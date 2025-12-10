"use client";

import { Question } from "@/types";

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
}: QuestionDisplayProps) {
  const colors = ["#FFE66D", "#FF6B9D", "#4ECDC4", "#95E1D3"];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center px-2">
        <div className="mb-2 text-xs sm:text-sm font-bold text-black">
          שאלה {questionNumber} מתוך {totalQuestions}
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-black break-words">
          {question.text}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
        {question.options.map((option, index) => (
          <div
            key={index}
            className="brutal-border p-4 sm:p-5 md:p-6 text-center min-h-[80px] sm:min-h-[100px] flex flex-col justify-center"
            style={{ backgroundColor: colors[index % colors.length] }}
          >
            <div className="mb-1 sm:mb-2 text-xs sm:text-sm font-black text-black">
              {String.fromCharCode(65 + index)}
            </div>
            <div className="text-base sm:text-lg font-black text-black break-words">
              {option}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
