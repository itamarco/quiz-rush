"use client";

import { useState } from "react";
import { Question, Quiz } from "@/types";

interface QuizBuilderProps {
  quiz?: Quiz;
  questions?: Question[];
  onSave: (
    quiz: Omit<Quiz, "id" | "created_at" | "user_id">,
    questions: Omit<Question, "id" | "quiz_id" | "created_at">[]
  ) => Promise<void>;
}

export default function QuizBuilder({
  quiz,
  questions: initialQuestions,
  onSave,
}: QuizBuilderProps) {
  const [title, setTitle] = useState(quiz?.title || "");
  const [description, setDescription] = useState(quiz?.description || "");
  const [timeLimit, setTimeLimit] = useState(quiz?.time_limit || 15);
  const [questions, setQuestions] = useState<
    Omit<Question, "id" | "quiz_id" | "created_at">[]
  >(
    initialQuestions?.map((q) => ({
      text: q.text,
      options: q.options,
      correct_index: q.correct_index,
      order: q.order,
    })) || [
      {
        text: "",
        options: ["", "", "", ""],
        correct_index: 0,
        order: 0,
      },
    ]
  );
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        options: ["", "", "", ""],
        correct_index: 0,
        order: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(
      questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order: i }))
    );
  };

  const updateQuestion = (index: number, field: string, value: unknown) => {
    const updated = [...questions];
    if (field === "text" || field === "correct_index" || field === "order") {
      updated[index] = { ...updated[index], [field]: value };
    } else if (field.startsWith("option_")) {
      const optionIndex = parseInt(field.split("_")[1]);
      const newOptions = [...updated[index].options];
      newOptions[optionIndex] = value as string;
      updated[index] = { ...updated[index], options: newOptions };
    }
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("אנא הזן כותרת לחידון");
      return;
    }

    const validQuestions = questions.filter(
      (q) => q.text.trim() && q.options.every((opt) => opt.trim())
    );
    if (validQuestions.length === 0) {
      alert("אנא הוסף לפחות שאלה אחת");
      return;
    }

    for (const q of validQuestions) {
      if (!q.options[q.correct_index]?.trim()) {
        alert(`שאלה ${q.order + 1}: אנא בחר תשובה נכונה`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim() || null,
          time_limit: timeLimit,
        },
        validQuestions
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-sm font-bold text-black mb-2">
            כותרת החידון
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="brutal-input w-full bg-white px-3 py-2 text-black min-h-[44px] text-base"
            placeholder="הזן כותרת לחידון"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-black mb-2">
            תיאור (אופציונלי)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="brutal-input w-full bg-white px-3 py-2 text-black text-base"
            placeholder="הזן תיאור לחידון"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-black mb-2">
            מגבלת זמן (שניות) - ברירת מחדל: 15
          </label>
          <input
            type="number"
            min="5"
            max="60"
            value={timeLimit}
            onChange={(e) => setTimeLimit(parseInt(e.target.value) || 15)}
            className="brutal-input w-full bg-white px-3 py-2 text-black min-h-[44px] text-base"
          />
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-black">שאלות</h2>
        </div>

        {questions.map((question, qIndex) => (
          <div key={qIndex} className="brutal-card bg-[#FFF9E6] p-3 sm:p-4">
            <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black text-black">
                שאלה {qIndex + 1}
              </h3>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="brutal-button bg-[#FF6B6B] px-3 py-1 text-xs sm:text-sm font-black text-black min-h-[36px] w-full sm:w-auto"
                >
                  מחק
                </button>
              )}
            </div>

            <div className="mb-3 sm:mb-4">
              <label className="block text-sm font-bold text-black mb-2">
                טקסט השאלה
              </label>
              <textarea
                value={question.text}
                onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                className="brutal-input w-full bg-white px-3 py-2 text-black text-base"
                placeholder="הזן את השאלה שלך"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-black mb-2">
                אפשרויות תשובה
              </label>
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct_${qIndex}`}
                    checked={question.correct_index === oIndex}
                    onChange={() =>
                      updateQuestion(qIndex, "correct_index", oIndex)
                    }
                    className="h-5 w-5 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) =>
                      updateQuestion(qIndex, `option_${oIndex}`, e.target.value)
                    }
                    className="brutal-input flex-1 bg-white px-3 py-2 text-black min-h-[44px] text-base"
                    placeholder={`אפשרות ${String.fromCharCode(65 + oIndex)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            onClick={addQuestion}
            className="brutal-button bg-[#4ECDC4] px-4 py-2 text-sm sm:text-base font-black text-black min-h-[44px] w-full sm:w-auto"
          >
            הוסף שאלה
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 sm:gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="brutal-button bg-[#FF6B9D] px-5 sm:px-6 py-2 text-sm sm:text-base font-black text-black disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
        >
          {saving ? "שומר..." : quiz ? "עדכן חידון" : "צור חידון"}
        </button>
      </div>
    </div>
  );
}
