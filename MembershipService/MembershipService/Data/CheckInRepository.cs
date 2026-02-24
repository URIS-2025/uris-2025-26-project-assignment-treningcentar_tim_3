using AutoMapper;
using MembershipService.Context;
using MembershipService.Models;
using MembershipService.Models.Enums;
using MembershipService.Models.DTO;
using MembershipService.ServiceCalls.Logger;

namespace MembershipService.Data;

public class CheckinRepository : ICheckinRepository
{
    private readonly MembershipContext _context;
    private readonly IMapper _mapper;
    private readonly ILoggerService _loggerService;

    public CheckinRepository(MembershipContext context, IMapper mapper, ILoggerService loggerService)
    {
        _context = context;
        _mapper = mapper;
        _loggerService = loggerService;
    }

    public void RecordCheckin(Guid userId, DateTime timestamp, string location)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.UserId == userId && m.Status == MembershipStatus.Active);
        if (membership == null)
        {
            _loggerService.LogErrorAsync("RecordCheckin", $"User {userId} does not have an active membership.", userId).GetAwaiter().GetResult();
            throw new InvalidOperationException("User does not have an active membership.");
        }

        var todayCheckin = _context.Checkins.Any(c => c.MembershipId == membership.MembershipId &&
            c.Timestamp.Date == timestamp.Date);
        if (todayCheckin)
        {
            _loggerService.LogWarningAsync("RecordCheckin", $"User {userId} already checked in today.", userId).GetAwaiter().GetResult();
            throw new InvalidOperationException("User has already checked in today.");
        }

        var checkin = new Checkin
        {
            CheckinId = Guid.NewGuid(),
            MembershipId = membership.MembershipId,
            Timestamp = timestamp,
            Location = location
        };

        _context.Checkins.Add(checkin);
        _context.SaveChanges();

        _ = _loggerService.LogInfoAsync("RecordCheckin", $"Check-in recorded", userId,
            $"Location: {location}, Membership: {membership.MembershipId}");
    }

    public IEnumerable<CheckinDto> GetCheckinHistory(Guid userId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Checkins
            .Where(c => c.Membership != null && c.Membership.UserId == userId);

        if (startDate.HasValue)
            query = query.Where(c => c.Timestamp >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(c => c.Timestamp <= endDate.Value);

        var checkins = query.OrderByDescending(c => c.Timestamp).ToList();
        return _mapper.Map<IEnumerable<CheckinDto>>(checkins);
    }

    public bool PreventDuplicateCheckinSameDay(Guid userId)
    {
        return !_context.Checkins.Any(c => c.Membership != null &&
            c.Membership.UserId == userId &&
            c.Timestamp.Date == DateTime.UtcNow.Date);
    }

    public bool ValidateMembershipForCheckin(Guid userId)
    {
        var membership = _context.Memberships.FirstOrDefault(m => m.UserId == userId && m.Status == MembershipStatus.Active);
        return membership != null && membership.IsActive();
    }
}