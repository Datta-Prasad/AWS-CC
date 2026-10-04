import React from 'react';
import { ORDER_STATUSES } from '../utils/statusFlow';

export default function StatusStepper({ status }) {
  const isCancelled = status === 'CANCELLED';
  const currentStepIndex = ORDER_STATUSES.indexOf(status);

  if (isCancelled) {
    return (
      <div className="cancelled-badge">
        ⚠️ This order has been CANCELLED.
      </div>
    );
  }

  const progressPercentage = currentStepIndex >= 0 
    ? (currentStepIndex / (ORDER_STATUSES.length - 1)) * 100 
    : 0;

  return (
    <div className="stepper-container">
      <div className="stepper-progress-bar">
        <div
          className="stepper-progress-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      {ORDER_STATUSES.map((statusStep, index) => {
        const isCompleted = currentStepIndex > index;
        const isActive = currentStepIndex === index;

        return (
          <div
            key={statusStep}
            className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? '✓' : index + 1}
            </div>
            <div className="step-label">
              {statusStep.replace(/_/g, ' ')}
            </div>
          </div>
        );
      })}
    </div>
  );
}
