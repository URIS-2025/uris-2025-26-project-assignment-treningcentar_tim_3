// TS interfaces matching MeasurmentService DTOs

// GuidelineCategory - as const object (not enum) due to erasableSyntaxOnly TS flag
export const GuidelineCategory = {
    Nutrition: 0,
    Training: 1,
    Recovery: 2,
    Other: 3,
} as const;

export type GuidelineCategory = (typeof GuidelineCategory)[keyof typeof GuidelineCategory];

export const GuidelineCategoryLabel: Record<GuidelineCategory, string> = {
    [GuidelineCategory.Nutrition]: 'Nutrition',
    [GuidelineCategory.Training]: 'Training',
    [GuidelineCategory.Recovery]: 'Recovery',
    [GuidelineCategory.Other]: 'Other',
};

// GET /api/measurementAppointment   GET /api/measurementAppointment/{id}
export interface MeasurementAppointmentDTO {
    appointmentId: string;
    memberId: string;
    employeeId: string;
    nutritionistId: string;
    date: string; // ISO 8601
    weightKg?: number | null;
    heightCm?: number | null;
    bodyFatPercent?: number | null;
    notes?: string | null;
    serviceId?: string | null;
    guidelineId?: string | null;
}

// POST /api/measurementAppointment
export interface MeasurementAppointmentCreateDTO {
    memberId: string;
    employeeId: string;           // trainer
    nutritionistId?: string;      // optional when sent by Nutritionist (set by backend)
    date: string;                 // ISO 8601
    notes?: string;
    serviceId?: string;
}

// PUT /api/measurementAppointment/{id}/results
export interface MeasurementResultsDTO {
    weightKg?: number | null;
    heightCm?: number | null;
    bodyFatPercent?: number | null;
}

// GET /api/guidelines/{id}
export interface GuidelineDTO {
    guidelineId: string;
    appointmentId: string;
    createdByNutritionistId: string;
    title: string;
    content: string;
    category: GuidelineCategory;
    lastUpdated: string;
}

// POST /api/measurementAppointment/{id}/guidelines
// PUT  /api/guidelines/{id}
export interface GuidelineCreateDTO {
    title: string;
    content: string;
    category: GuidelineCategory;
}
