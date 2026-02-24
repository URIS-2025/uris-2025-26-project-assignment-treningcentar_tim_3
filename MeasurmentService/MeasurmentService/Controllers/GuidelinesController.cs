using AutoMapper;
using MeasurmentService.Clients;
using MeasurmentService.Models.DTO;
using MeasurmentService.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MeasurmentService.Controllers;

[Authorize]
[ApiController]
[Route("api/guidelines")]
public class GuidelinesController : ControllerBase
{
    private readonly IGuidelineRepository _repo;
    private readonly IMapper _mapper;
    private readonly LoggerServiceClient _loggerClient;

    private const string ServiceName = "MeasurmentService";

    public GuidelinesController(IGuidelineRepository repo, IMapper mapper, LoggerServiceClient loggerClient)
    {
        _repo = repo;
        _mapper = mapper;
        _loggerClient = loggerClient;
    }

    private Guid CurrentUserId =>
        Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Missing user id claim")
        );

    private string CurrentRole
    {
        get
        {
            if (User.IsInRole("Admin")) return "Admin";
            if (User.IsInRole("Nutritionist")) return "Nutritionist";
            if (User.IsInRole("Trainer")) return "Trainer";
            if (User.IsInRole("Member")) return "Member";
            return "";
        }
    }

    private string CorrelationId =>
        Request.Headers.TryGetValue("X-Correlation-Id", out var h) && !string.IsNullOrWhiteSpace(h)
            ? h.ToString()
            : HttpContext.TraceIdentifier;

    private string? BearerHeader =>
        Request.Headers.TryGetValue("Authorization", out var h) ? h.ToString() : null;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GuidelineDTO>>> GetAll()
    {
        if (string.IsNullOrWhiteSpace(CurrentRole)) return Forbid();

        var items = await _repo.GetAllVisibleAsync(CurrentUserId, CurrentRole);
        return Ok(items.Select(_mapper.Map<GuidelineDTO>));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GuidelineDTO>> GetById(Guid id)
    {
        if (string.IsNullOrWhiteSpace(CurrentRole)) return Forbid();

        var visible = await _repo.GetAllVisibleAsync(CurrentUserId, CurrentRole);
        var item = visible.FirstOrDefault(x => x.GuidelineId == id);

        if (item == null) return NotFound();
        return Ok(_mapper.Map<GuidelineDTO>(item));
    }

    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] GuidelineCreateDTO dto)
    {
        var userId = CurrentUserId;

        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.CreatedByNutritionistId != userId)
            return Forbid();

        entity.Title = dto.Title;
        entity.Content = dto.Content;
        entity.Category = dto.Category;
        entity.LastUpdated = DateTime.UtcNow;

        await _repo.SaveAsync();

        await _loggerClient.TryLogAsync(
            new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = ServiceName,
                Action = "UpdateGuideline",
                Message = "Guideline updated",
                Details = $"GuidelineId={entity.GuidelineId}; AppointmentId={entity.AppointmentId}; Category={entity.Category}; Title={entity.Title}; ContentLen={(entity.Content?.Length ?? 0)}",
                CorrelationId = CorrelationId,
                EntityType = "Guideline",
                EntityId = entity.GuidelineId,
                UserId = userId
            },
            bearerHeader: BearerHeader,
            requestCt: HttpContext.RequestAborted
        );

        return NoContent();
    }

    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId;

        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.CreatedByNutritionistId != userId)
            return Forbid();

        _repo.Remove(entity);
        await _repo.SaveAsync();

        await _loggerClient.TryLogAsync(
            new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = ServiceName,
                Action = "DeleteGuideline",
                Message = "Guideline deleted",
                Details = $"GuidelineId={entity.GuidelineId}; AppointmentId={entity.AppointmentId}; Category={entity.Category}; Title={entity.Title}",
                CorrelationId = CorrelationId,
                EntityType = "Guideline",
                EntityId = entity.GuidelineId,
                UserId = userId
            },
            bearerHeader: BearerHeader,
            requestCt: HttpContext.RequestAborted
        );

        return NoContent();
    }
}