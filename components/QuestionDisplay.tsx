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
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-2 text-sm font-bold text-black">
          שאלה {questionNumber} מתוך {totalQuestions}
        </div>
        <h2 className="text-4xl font-black text-black">{question.text}</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {question.options.map((option, index) => (
          <div
            key={index}
            className="brutal-border p-6 text-center"
            style={{ backgroundColor: colors[index % colors.length] }}
          >
            <div className="mb-2 text-sm font-black text-black">
              {String.fromCharCode(65 + index)}
            </div>
            <div className="text-lg font-black text-black">{option}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
