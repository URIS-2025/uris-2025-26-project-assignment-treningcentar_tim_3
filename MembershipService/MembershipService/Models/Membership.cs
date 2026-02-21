using MembershipService.Models.Enums;

namespace MembershipService.Models;

public class Membership
{
    public Guid MembershipId { get; set; }

    public Guid UserId { get; set; }

    public Guid PackageId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public DateTime? CancelledDate { get; set; }

    public MembershipStatus Status { get; set; }

    public Package? Package { get; set; }

    public List<Checkin> Checkins { get; set; } = new();

    // Methods
    public bool IsActive()
    {
        return Status == MembershipStatus.Active && EndDate > DateTime.UtcNow;
    }

    public bool Renew(int durationDays)
    {
        if (Status == MembershipStatus.Cancelled)
            return false;

        EndDate = EndDate.AddDays(durationDays);
        Status = MembershipStatus.Active;
        return true;
    }

    public bool Cancel()
    {
        if (Status == MembershipStatus.Cancelled)
            return false;

        Status = MembershipStatus.Cancelled;
        CancelledDate = DateTime.UtcNow;
        return true;
    }

    public int DaysUntilExpiration()
    {
        var days = (EndDate - DateTime.UtcNow).Days;
        return days < 0 ? 0 : days;
    }

    public bool CanBeModified()
    {
        return Status != MembershipStatus.Cancelled && (StartDate > DateTime.UtcNow || EndDate < DateTime.UtcNow);
    }
}
