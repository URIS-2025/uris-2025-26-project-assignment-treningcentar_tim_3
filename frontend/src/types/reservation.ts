export const SessionStatus = {
    Pending: 0,
    Confirmed: 1,
    Cancelled: 2,
    Completed: 3
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const TrainingType = {
    Personal: 1,
    Group: 2
} as const;
export type TrainingType = (typeof TrainingType)[keyof typeof TrainingType];

export interface TrainerDto {
    trainerId: string;
    fullName: string;
}

export interface SessionDto {
    sessionId: string;
    name: string;
    startTime: string;
    endTime: string;
    status: SessionStatus;
    trainingType: TrainingType;
    trainerId: TrainerDto;
    maxCapacity?: number;
    hallId?: number;
}
