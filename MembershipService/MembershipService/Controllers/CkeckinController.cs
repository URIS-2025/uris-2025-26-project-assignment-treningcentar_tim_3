using Microsoft.AspNetCore.Mvc;
using MembershipService.Data;
using MembershipService.Models.DTO;
using Microsoft.AspNetCore.Authorization;

namespace MembershipService.Controllers;

[ApiController]
[Route("api/checkins")]
public class CheckinsController : ControllerBase
{
    private readonly ICheckinRepository _checkinRepository;

    public CheckinsController(ICheckinRepository checkinRepository)
    {
        _checkinRepository = checkinRepository;
    }

    // POST: api/checkins
    [HttpPost]
    public ActionResult RecordCheckin([FromBody] RecordCheckinDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            _checkinRepository.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location);
            return Ok("Check-in recorded successfully.");
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    // GET: api/checkins/{userId}/history
    [HttpGet("{userId:guid}/history")]
    public ActionResult<IEnumerable<CheckinDto>> GetCheckinHistory(
        Guid userId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var history = _checkinRepository.GetCheckinHistory(userId, startDate, endDate);
        return Ok(history);
    }

    // GET: api/checkins/{userId}/can-checkin
    [HttpGet("{userId:guid}/can-checkin")]
    public ActionResult<bool> CanCheckinToday(Guid userId)
    {
        var canCheckin = _checkinRepository.PreventDuplicateCheckinSameDay(userId);
        return Ok(canCheckin);
    }

    // GET: api/checkins/{userId}/validate-membership
    [HttpGet("{userId:guid}/validate-membership")]
    public ActionResult<bool> ValidateMembershipForCheckin(Guid userId)
    {
        var isValid = _checkinRepository.ValidateMembershipForCheckin(userId);
        if (!isValid)
            return Ok(false);

        return Ok(true);
    }
    
    // POST: api/checkins/manual
    [HttpPost("manual")]
    [Authorize(Roles = "Receptionist")]
    public ActionResult RecordManualCheckin([FromBody] RecordCheckinDto dto)
    {
        try
        {
            _checkinRepository.RecordCheckin(dto.UserId, dto.Timestamp, dto.Location);
            return Ok("Check-in recorded successfully.");
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }
}