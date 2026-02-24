using MembershipService.Models.DTO;

namespace MembershipService.Data;

public interface ICheckinRepository
{
    void RecordCheckin(Guid userId, DateTime timestamp, string location);
    IEnumerable<CheckinDto> GetCheckinHistory(Guid userId, DateTime? startDate = null, DateTime? endDate = null);
    bool PreventDuplicateCheckinSameDay(Guid userId);
    bool ValidateMembershipForCheckin(Guid userId);
    
    IEnumerable<CheckinDto> GetCurrentMonthCheckins(Guid userId);
}