import React, { useState } from 'react';

interface SavingsGoalProps {
  currentAmount: number;
  goalAmount: number;
  progress: number; // 0-100
  onUpdateGoal: (newGoal: number) => void;
  className?: string;
}

export default function SavingsGoal({
  currentAmount,
  goalAmount,
  progress,
  onUpdateGoal,
  className = '',
}: SavingsGoalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState(goalAmount.toString());

  const handleSave = () => {
    const goal = parseFloat(newGoal);
    if (!isNaN(goal) && goal > 0) {
      onUpdateGoal(goal);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setNewGoal(goalAmount.toString());
    setIsEditing(false);
  };

  const progressColor =
    progress >= 100
      ? 'bg-green-600'
      : progress >= 75
        ? 'bg-blue-600'
        : progress >= 50
          ? 'bg-yellow-500'
          : 'bg-gray-400';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🎯 Objectif mensuel
          </h3>
          {!isEditing && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Objectif: {goalAmount.toFixed(2)}€
            </p>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Modifier
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="savings-goal-amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nouvel objectif (€)
            </label>
            <input
              id="savings-goal-amount"
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              min="0"
              step="5"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Enregistrer
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">
                {currentAmount.toFixed(2)}€ / {goalAmount.toFixed(2)}€
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`${progressColor} h-3 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {progress >= 100 ? (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300 font-medium flex items-center gap-2">
                <span>🎉</span>
                Félicitations ! Objectif atteint !
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              Plus que {(goalAmount - currentAmount).toFixed(2)}€ pour atteindre votre objectif !
            </p>
          )}
        </>
      )}
    </div>
  );
}
