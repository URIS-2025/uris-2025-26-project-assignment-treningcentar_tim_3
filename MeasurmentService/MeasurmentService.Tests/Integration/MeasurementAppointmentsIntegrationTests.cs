using AutoMapper;
using MeasurmentService.Clients;
using MeasurmentService.Controllers;
using MeasurmentService.Models;
using MeasurmentService.Models.DTO;
using MeasurmentService.Profiles;
using MeasurmentService.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Security.Claims;

namespace MeasurmentService.Tests.Integration;

/// <summary>
/// Integration tests: real repository + real AutoMapper + InMemory EF Core.
/// ServiceServiceClient and LoggerServiceClient are faked via mock HttpMessageHandler.
/// </summary>
[TestFixture]
public class MeasurementAppointmentsIntegrationTests
{
    private TestMeasurementContext _ctx = null!;
    private IMapper _mapper = null!;
    private MeasurementAppointmentRepository _appointmentRepo = null!;
    private GuidelineRepository _guidelineRepo = null!;
    private ServiceServiceClient _serviceClient = null!;
    private LoggerServiceClient _loggerClient = null!;
    private MeasurementAppointmentsController _controller = null!;

    private Guid _nutritionistId;
    private Guid _memberId;
    private Guid _trainerId;

    [SetUp]
    public void SetUp()
    {
        // ── InMemory DB ────────────────────────────────────────────────────
        var dbOptions = new DbContextOptionsBuilder<Data.MeasurementContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _ctx = new TestMeasurementContext(dbOptions);

        // ── AutoMapper ─────────────────────────────────────────────────────
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<MeasurementProfile>();
        });
        _mapper = mapperConfig.CreateMapper();

        // ── Repositories ───────────────────────────────────────────────────
        _appointmentRepo = new MeasurementAppointmentRepository(_ctx);
        _guidelineRepo = new GuidelineRepository(_ctx);

        // ── ServiceServiceClient – always returns "exists = true" ──────────
        var serviceHandler = new FakeHttpHandler(HttpStatusCode.OK);
        var serviceFactory = CreateFactory("ServiceService", serviceHandler);
        _serviceClient = new ServiceServiceClient(serviceFactory);

        // ── LoggerServiceClient – best-effort, silently ignored ────────────
        var loggerHandler = new FakeHttpHandler(HttpStatusCode.OK);
        var loggerFactory = CreateFactory("LoggerService", loggerHandler);
        _loggerClient = new LoggerServiceClient(loggerFactory);

        // ── Test user IDs ──────────────────────────────────────────────────
        _nutritionistId = Guid.NewGuid();
        _memberId = Guid.NewGuid();
        _trainerId = Guid.NewGuid();

        // ── Controller + HttpContext (Nutritionist role) ───────────────────
        _controller = new MeasurementAppointmentsController(
            _appointmentRepo, _guidelineRepo, _mapper, _serviceClient, _loggerClient);
        SetUser(_controller, _nutritionistId, "Nutritionist");
    }

    [TearDown]
    public void TearDown()
    {
        _ctx.Database.EnsureDeleted();
        _ctx.Dispose();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1 – POST creates appointment and persists to DB
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task Create_ValidDto_ReturnsCreatedAndPersistsToDb()
    {
        var dto = new MeasurementAppointmentCreateDTO
        {
            MemberId = _memberId,
            EmployeeId = _trainerId,
            Date = DateTime.UtcNow.AddDays(1),
            Notes = "Integration test appointment"
        };

        var result = await _controller.Create(dto);

        // Should return 201 Created
        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = (CreatedAtActionResult)result.Result!;
        var outDto = (MeasurementAppointmentDTO)created.Value!;

        // Returned DTO should have the Nutritionist's id auto-set
        Assert.That(outDto.NutritionistId, Is.EqualTo(_nutritionistId));
        Assert.That(outDto.MemberId, Is.EqualTo(_memberId));

        // Row must exist in the InMemory DB
        var inDb = await _ctx.MeasurementAppointments.FindAsync(outDto.AppointmentId);
        Assert.That(inDb, Is.Not.Null);
        Assert.That(inDb!.NutritionistId, Is.EqualTo(_nutritionistId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2 – GET returns only appointments belonging to the logged-in Nutritionist
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task GetAll_AsNutritionist_ReturnsOnlyOwnAppointments()
    {
        var otherNutritionistId = Guid.NewGuid();

        // Seed: one owned, one by other nutritionist
        _ctx.MeasurementAppointments.AddRange(
            new MeasurementAppointment
            {
                MemberId = _memberId,
                EmployeeId = _trainerId,
                NutritionistId = _nutritionistId,
                Date = DateTime.UtcNow
            },
            new MeasurementAppointment
            {
                MemberId = Guid.NewGuid(),
                EmployeeId = Guid.NewGuid(),
                NutritionistId = otherNutritionistId,
                Date = DateTime.UtcNow
            });
        await _ctx.SaveChangesAsync();

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var list = ((OkObjectResult)result.Result!).Value as IEnumerable<MeasurementAppointmentDTO>;
        Assert.That(list, Is.Not.Null);
        var items = list!.ToList();
        Assert.That(items, Has.Count.EqualTo(1));
        Assert.That(items[0].NutritionistId, Is.EqualTo(_nutritionistId));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3 – GET /{id} returns the appointment when it belongs to the Nutritionist
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task GetById_OwnAppointment_ReturnsOk()
    {
        var appt = new MeasurementAppointment
        {
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        _ctx.MeasurementAppointments.Add(appt);
        await _ctx.SaveChangesAsync();

        var result = await _controller.GetById(appt.AppointmentId);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var dto = ((OkObjectResult)result.Result!).Value as MeasurementAppointmentDTO;
        Assert.That(dto, Is.Not.Null);
        Assert.That(dto!.AppointmentId, Is.EqualTo(appt.AppointmentId));
    }

    [Test]
    public async Task GetById_NotFound_Returns404()
    {
        var result = await _controller.GetById(Guid.NewGuid());
        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4 – PUT /{id}/results updates measurements in DB
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task UpdateResults_OwnAppointment_PersistsToDb()
    {
        var appt = new MeasurementAppointment
        {
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        _ctx.MeasurementAppointments.Add(appt);
        await _ctx.SaveChangesAsync();

        var resultsDto = new MeasurementResultsDTO
        {
            WeightKg = 75.5,
            HeightCm = 178.0,
            BodyFatPercent = 18.2
        };

        var result = await _controller.UpdateResults(appt.AppointmentId, resultsDto);

        Assert.That(result, Is.InstanceOf<NoContentResult>());

        // Verify DB updated
        var updated = await _ctx.MeasurementAppointments.FindAsync(appt.AppointmentId);
        Assert.That(updated, Is.Not.Null);
        Assert.That(updated!.Measurements.WeightKg, Is.EqualTo(75.5));
        Assert.That(updated.Measurements.HeightCm, Is.EqualTo(178.0));
        Assert.That(updated.Measurements.BodyFatPercent, Is.EqualTo(18.2));
    }

    [Test]
    public async Task UpdateResults_NegativeWeight_ReturnsBadRequest()
    {
        var appt = new MeasurementAppointment
        {
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        _ctx.MeasurementAppointments.Add(appt);
        await _ctx.SaveChangesAsync();

        var resultsDto = new MeasurementResultsDTO { WeightKg = -5 };
        var result = await _controller.UpdateResults(appt.AppointmentId, resultsDto);

        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5 – POST /{appointmentId}/guidelines creates guideline in DB
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task CreateGuidelineForAppointment_ValidData_PersistsToDb()
    {
        var appt = new MeasurementAppointment
        {
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        _ctx.MeasurementAppointments.Add(appt);
        await _ctx.SaveChangesAsync();

        var dto = new GuidelineCreateDTO
        {
            Title = "Nutrition plan",
            Content = "Eat more protein and vegetables.",
            Category = Models.GuidelineCategory.Nutrition
        };

        var result = await _controller.CreateGuidelineForAppointment(appt.AppointmentId, dto);

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = (CreatedAtActionResult)result.Result!;
        var guidelineDto = (GuidelineDTO)created.Value!;

        Assert.That(guidelineDto.Title, Is.EqualTo("Nutrition plan"));

        // Verify DB
        var inDb = await _ctx.Guidelines.FindAsync(guidelineDto.GuidelineId);
        Assert.That(inDb, Is.Not.Null);
        Assert.That(inDb!.AppointmentId, Is.EqualTo(appt.AppointmentId));
        Assert.That(inDb.CreatedByNutritionistId, Is.EqualTo(_nutritionistId));
    }

    [Test]
    public async Task CreateGuidelineForAppointment_AppointmentNotFound_Returns404()
    {
        var dto = new GuidelineCreateDTO
        {
            Title = "Test",
            Content = "Test content",
            Category = Models.GuidelineCategory.Other
        };

        var result = await _controller.CreateGuidelineForAppointment(Guid.NewGuid(), dto);
        Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
    }

    [Test]
    public async Task CreateGuidelineForAppointment_DuplicateGuideline_ReturnsConflict()
    {
        var appt = new MeasurementAppointment
        {
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        var guideline = new Guideline
        {
            AppointmentId = appt.AppointmentId,
            CreatedByNutritionistId = _nutritionistId,
            Title = "Existing",
            Content = "Existing content"
        };
        appt.Guideline = guideline;
        _ctx.MeasurementAppointments.Add(appt);
        await _ctx.SaveChangesAsync();

        var dto = new GuidelineCreateDTO
        {
            Title = "Duplicate",
            Content = "Duplicate content",
            Category = Models.GuidelineCategory.Other
        };

        var result = await _controller.CreateGuidelineForAppointment(appt.AppointmentId, dto);
        Assert.That(result.Result, Is.InstanceOf<ConflictObjectResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private static void SetUser(ControllerBase controller, Guid userId, string role)
    {
        var claims = new List<Claim>
        {
            // ClaimTypes.NameIdentifier is what the controller uses first
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private static IHttpClientFactory CreateFactory(string name, HttpMessageHandler handler)
    {
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost") };
        var mock = new Mock<IHttpClientFactory>();
        mock.Setup(f => f.CreateClient(name)).Returns(http);
        return mock.Object;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Minimal fake HTTP handler (always returns the given status code)
    // ─────────────────────────────────────────────────────────────────────────
    private sealed class FakeHttpHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _status;
        public FakeHttpHandler(HttpStatusCode status) => _status = status;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(_status));
    }
}
