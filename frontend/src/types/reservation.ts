export const SessionStatus = {
    Upcoming: 0,
    Finished: 1,
    Canceled: 2
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const TrainingType = {
    Strength: 0,
    Hypertrophy: 1,
    Cardio: 2,
    HIIT: 3,
    CrossFit: 4,
    Functional: 5,
    Mobility: 6,
    Stretching: 7,
    Yoga: 8,
    Pilates: 9,
    Boxing: 10
} as const;
export type TrainingType = (typeof TrainingType)[keyof typeof TrainingType];

export const SessionType = {
    Personal: 1,
    Group: 2
} as const;
export type SessionType = (typeof SessionType)[keyof typeof SessionType];

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
    currentBookings: number;
    isBookedByCurrentUser: boolean;
    trainingHallId?: string;
    trainingHallName?: string;
}
