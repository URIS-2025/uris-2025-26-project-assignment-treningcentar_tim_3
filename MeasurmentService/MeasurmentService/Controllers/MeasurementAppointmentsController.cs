using AutoMapper;
using MeasurmentService.Models;
using MeasurmentService.Models.DTO;
using MeasurmentService.Repositories;
using MeasurmentService.Clients;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MeasurmentService.Controllers;

[ApiController]
[Route("api/measurementAppointment")]
[Authorize]
public class MeasurementAppointmentsController : ControllerBase
{
    private readonly IMeasurementAppointmentRepository _repo;
    private readonly IGuidelineRepository _guidelineRepo;
    private readonly IMapper _mapper;
    private readonly ServiceServiceClient _serviceClient;
    private readonly LoggerServiceClient _loggerClient;

    public MeasurementAppointmentsController(
        IMeasurementAppointmentRepository repo,
        IGuidelineRepository guidelineRepo,
        IMapper mapper,
        ServiceServiceClient serviceClient,
        LoggerServiceClient loggerClient)
    {
        _repo = repo;
        _guidelineRepo = guidelineRepo;
        _mapper = mapper;
        _serviceClient = serviceClient;
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
            if (User.IsInRole("Receptionist")) return "Receptionist";
            return "";
        }
    }

    private const string ServiceName = "MeasurmentService";

    private string CorrelationId =>
        Request.Headers.TryGetValue("X-Correlation-Id", out var h) && !string.IsNullOrWhiteSpace(h)
            ? h.ToString()
            : HttpContext.TraceIdentifier;

    private string? BearerHeader =>
        Request.Headers.TryGetValue("Authorization", out var h) ? h.ToString() : null;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MeasurementAppointmentDTO>>> GetAll()
    {
        if (string.IsNullOrWhiteSpace(CurrentRole)) return Forbid();

        var items = await _repo.GetAllVisibleAsync(CurrentUserId, CurrentRole);
        return Ok(items.Select(_mapper.Map<MeasurementAppointmentDTO>));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MeasurementAppointmentDTO>> GetById(Guid id)
    {
        var item = await _repo.GetByIdAsync(id);
        if (item == null) return NotFound();

        var userId = CurrentUserId;
        var allowed =
            User.IsInRole("Admin")
            || (User.IsInRole("Nutritionist") && item.NutritionistId == userId)
            || (User.IsInRole("Trainer") && item.EmployeeId == userId)
            || (User.IsInRole("Member") && item.MemberId == userId)
            || User.IsInRole("Receptionist");

        if (!allowed) return Forbid();

        return Ok(_mapper.Map<MeasurementAppointmentDTO>(item));
    }

    // Samo Nutritionist/Admin kreira appointment (bez rezultata!)
    [Authorize(Roles = "Nutritionist,Admin,Receptionist")]
    [HttpPost]
    public async Task<ActionResult<MeasurementAppointmentDTO>> Create([FromBody] MeasurementAppointmentCreateDTO dto)
    {
        var userId = CurrentUserId;

        if (dto.MemberId == Guid.Empty || dto.EmployeeId == Guid.Empty)
            return BadRequest("MemberId and EmployeeId must be valid GUIDs.");

        if (dto.ServiceId.HasValue)
        {
            try
            {
                var exists = await _serviceClient.ServiceExistsAsync(dto.ServiceId.Value);
                if (!exists) return BadRequest("ServiceId does not exist.");
            }
            catch
            {
                return StatusCode(503, "ServiceService is unavailable.");
            }
        }

        var entity = _mapper.Map<MeasurementAppointment>(dto);
        
        // Ensure UTC for PostgreSQL
        entity.Date = DateTime.SpecifyKind(entity.Date, DateTimeKind.Utc);

        // Ako Nutritionist kreira -> on je owner
        if (User.IsInRole("Nutritionist"))
        {
            entity.NutritionistId = userId;
        }
        else
        {
            // Admin ili Receptionist moraju da pošalju NutritionistId
            if (!dto.NutritionistId.HasValue || dto.NutritionistId.Value == Guid.Empty)
                return BadRequest("NutritionistId is required when Admin/Receptionist creates an appointment.");

            entity.NutritionistId = dto.NutritionistId.Value;
        }

        await _repo.AddAsync(entity);
        await _repo.SaveAsync();

        await _loggerClient.TryLogAsync(
            new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = ServiceName,
                Action = "CreateAppointment",
                Message = "Measurement appointment created",
                Details = $"AppointmentId={entity.AppointmentId}; MemberId={entity.MemberId}; EmployeeId={entity.EmployeeId}; ServiceId={entity.ServiceId}; Date={entity.Date:o}",
                CorrelationId = CorrelationId,
                EntityType = "MeasurementAppointment",
                EntityId = entity.AppointmentId,
                UserId = userId
            },
            bearerHeader: BearerHeader,
            requestCt: HttpContext.RequestAborted
        );

        var outDto = _mapper.Map<MeasurementAppointmentDTO>(entity);
        return CreatedAtAction(nameof(GetById), new { id = entity.AppointmentId }, outDto);
    }

    // Samo Nutritionist/Admin menja appointment (bez rezultata!)
    [Authorize(Roles = "Nutritionist,Admin,Receptionist")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] MeasurementAppointmentCreateDTO dto)
    {
        var userId = CurrentUserId;

        if (dto.MemberId == Guid.Empty || dto.EmployeeId == Guid.Empty)
            return BadRequest("MemberId and EmployeeId must be valid GUIDs.");

        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && !User.IsInRole("Receptionist") && entity.NutritionistId != userId)
            return Forbid();

        if (dto.ServiceId.HasValue)
        {
            try
            {
                var exists = await _serviceClient.ServiceExistsAsync(dto.ServiceId.Value);
                if (!exists) return BadRequest("ServiceId does not exist.");
            }
            catch
            {
                return StatusCode(503, "ServiceService is unavailable.");
            }
        }

        entity.MemberId = dto.MemberId;
        entity.EmployeeId = dto.EmployeeId;
        entity.Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc);
        entity.Notes = dto.Notes;
        entity.ServiceId = dto.ServiceId;

        // NEMA više: entity.Measurements.* ovde!

        await _repo.SaveAsync();

        await _loggerClient.TryLogAsync(
            new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = ServiceName,
                Action = "UpdateAppointment",
                Message = "Measurement appointment updated",
                Details = $"AppointmentId={entity.AppointmentId}; MemberId={entity.MemberId}; EmployeeId={entity.EmployeeId}; ServiceId={entity.ServiceId}; Date={entity.Date:o}",
                CorrelationId = CorrelationId,
                EntityType = "MeasurementAppointment",
                EntityId = entity.AppointmentId,
                UserId = userId
            },
            bearerHeader: BearerHeader,
            requestCt: HttpContext.RequestAborted
        );

        return NoContent();
    }

    
    // NOVO: upis rezultata merenja (Nutritionist/Admin)
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPut("{id:guid}/results")]
    public async Task<IActionResult> UpdateResults(Guid id, [FromBody] MeasurementResultsDTO dto)
    {
        var userId = CurrentUserId;

        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.NutritionistId != userId)
            return Forbid();

        // (opciono) basic validacija
        if (dto.WeightKg is < 0 || dto.HeightCm is < 0 || dto.BodyFatPercent is < 0)
            return BadRequest("Measurements cannot be negative.");

        entity.Measurements.WeightKg = dto.WeightKg;
        entity.Measurements.HeightCm = dto.HeightCm;
        entity.Measurements.BodyFatPercent = dto.BodyFatPercent;

        await _repo.SaveAsync();

        await _loggerClient.TryLogAsync(
            new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = ServiceName,
                Action = "UpdateResults",
                Message = "Measurement results updated",
                Details = $"AppointmentId={entity.AppointmentId}; WeightKg={dto.WeightKg}; HeightCm={dto.HeightCm}; BodyFatPercent={dto.BodyFatPercent}",
                CorrelationId = CorrelationId,
                EntityType = "MeasurementAppointment",
                EntityId = entity.AppointmentId,
                UserId = userId
            },
            bearerHeader: BearerHeader,
            requestCt: HttpContext.RequestAborted
        );

        return NoContent();
    }

    // Samo Nutritionist/Admin briše
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId;

        var entity = await _repo.GetByIdAsync(id);
        if (entity == null) return NotFound();

        if (!User.IsInRole("Admin") && entity.NutritionistId != userId)
            return Forbid();

        _repo.Remove(entity);
        await _repo.SaveAsync();

        await _loggerClient.TryLogAsync(
            new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = ServiceName,
                Action = "DeleteAppointment",
                Message = "Measurement appointment deleted",
                Details = $"AppointmentId={entity.AppointmentId}; MemberId={entity.MemberId}; EmployeeId={entity.EmployeeId}; ServiceId={entity.ServiceId}; Date={entity.Date:o}",
                CorrelationId = CorrelationId,
                EntityType = "MeasurementAppointment",
                EntityId = entity.AppointmentId,
                UserId = userId
            },
            bearerHeader: BearerHeader,
            requestCt: HttpContext.RequestAborted
        );

        return NoContent();
    }

    // Guideline se kreira samo za postojeći appointment
    [Authorize(Roles = "Nutritionist,Admin")]
    [HttpPost("{appointmentId:guid}/guidelines")]
    public async Task<ActionResult<GuidelineDTO>> CreateGuidelineForAppointment(
        Guid appointmentId,
        [FromBody] GuidelineCreateDTO dto)
    {
        var userId = CurrentUserId;

        var appt = await _repo.GetByIdAsync(appointmentId);
        if (appt == null) return NotFound("Appointment not found.");

        if (!User.IsInRole("Admin") && appt.NutritionistId != userId)
            return Forbid();

        if (appt.Guideline != null)
            return Conflict("Guideline already exists for this appointment.");

        var guideline = _mapper.Map<Guideline>(dto);
        guideline.AppointmentId = appt.AppointmentId;
        guideline.CreatedByNutritionistId = userId;
        guideline.LastUpdated = DateTime.UtcNow;

        await _guidelineRepo.AddAsync(guideline);
        await _guidelineRepo.SaveAsync();

        await _loggerClient.TryLogAsync(
            new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = ServiceName,
                Action = "CreateGuideline",
                Message = "Guideline created for appointment",
                Details = $"AppointmentId={appt.AppointmentId}; Category={guideline.Category}; Title={guideline.Title}",
                CorrelationId = CorrelationId,
                EntityType = "Guideline",
                EntityId = guideline.GuidelineId,
                UserId = userId
            },
            bearerHeader: BearerHeader,
            requestCt: HttpContext.RequestAborted
        );

        return CreatedAtAction(
            actionName: "GetById",
            controllerName: "Guidelines",
            routeValues: new { id = guideline.GuidelineId },
            value: _mapper.Map<GuidelineDTO>(guideline)
        );
    }
}