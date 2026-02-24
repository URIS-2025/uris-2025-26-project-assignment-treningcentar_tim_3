export const MembershipStatus = {
    Active: 1,
    Expired: 2,
    Suspended: 3,
    Cancelled: 4
} as const;

export type MembershipStatus = (typeof MembershipStatus)[keyof typeof MembershipStatus];

export interface UserMembershipDto {
    membershipId: string;
    userId: string;
    packageId: string;
    startDate: string;
    endDate: string;
    createdDate: string;
    cancelledDate: string | null;
    status: MembershipStatus;
}

export interface MembershipPackageDto {
    packageId: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    services: string[];
}
