using AutoMapper;
using MeasurmentService.Clients;
using MeasurmentService.Controllers;
using MeasurmentService.Models;
using MeasurmentService.Models.DTO;
using MeasurmentService.Profiles;
using MeasurmentService.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System.Net;
using System.Security.Claims;

namespace MeasurmentService.Tests.Unit;

[TestFixture]
public class MeasurementAppointmentsControllerTests
{
    private Mock<IMeasurementAppointmentRepository> _repoMock = null!;
    private Mock<IGuidelineRepository> _guidelineRepoMock = null!;
    private IMapper _mapper = null!;
    private ServiceServiceClient _serviceClient = null!;
    private LoggerServiceClient _loggerClient = null!;
    private MeasurementAppointmentsController _controller = null!;

    private Guid _nutritionistId;
    private Guid _memberId;
    private Guid _trainerId;

    [SetUp]
    public void SetUp()
    {
        _repoMock = new Mock<IMeasurementAppointmentRepository>();
        _guidelineRepoMock = new Mock<IGuidelineRepository>();

        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MeasurementProfile>());
        _mapper = mapperConfig.CreateMapper();

        _serviceClient = CreateServiceClient(HttpStatusCode.OK);
        _loggerClient = CreateLoggerClient(HttpStatusCode.OK);

        _nutritionistId = Guid.NewGuid();
        _memberId = Guid.NewGuid();
        _trainerId = Guid.NewGuid();

        _controller = new MeasurementAppointmentsController(
            _repoMock.Object, _guidelineRepoMock.Object, _mapper, _serviceClient, _loggerClient);
        SetUser(_controller, _nutritionistId, "Nutritionist");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GetAll
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task GetAll_WhenAppointmentsExist_ReturnsOkWithList()
    {
        var appts = new List<MeasurementAppointment>
        {
            new() { MemberId = _memberId, EmployeeId = _trainerId, NutritionistId = _nutritionistId, Date = DateTime.UtcNow }
        };
        _repoMock.Setup(r => r.GetAllVisibleAsync(_nutritionistId, "Nutritionist"))
            .ReturnsAsync(appts);

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var list = ((OkObjectResult)result.Result!).Value as IEnumerable<MeasurementAppointmentDTO>;
        Assert.That(list, Is.Not.Null);
        Assert.That(list!.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetAll_WhenEmpty_ReturnsOkWithEmptyList()
    {
        _repoMock.Setup(r => r.GetAllVisibleAsync(_nutritionistId, "Nutritionist"))
            .ReturnsAsync(new List<MeasurementAppointment>());

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var list = ((OkObjectResult)result.Result!).Value as IEnumerable<MeasurementAppointmentDTO>;
        Assert.That(list, Is.Not.Null);
        Assert.That(list!.Count(), Is.EqualTo(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GetById
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task GetById_ExistingOwnedAppointment_ReturnsOk()
    {
        var apptId = Guid.NewGuid();
        var appt = new MeasurementAppointment
        {
            AppointmentId = apptId,
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        _repoMock.Setup(r => r.GetByIdAsync(apptId)).ReturnsAsync(appt);

        var result = await _controller.GetById(apptId);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var dto = ((OkObjectResult)result.Result!).Value as MeasurementAppointmentDTO;
        Assert.That(dto, Is.Not.Null);
        Assert.That(dto!.AppointmentId, Is.EqualTo(apptId));
    }

    [Test]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((MeasurementAppointment?)null);

        var result = await _controller.GetById(Guid.NewGuid());

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task GetById_AppointmentBelongsToOtherNutritionist_ReturnsForbid()
    {
        var apptId = Guid.NewGuid();
        var appt = new MeasurementAppointment
        {
            AppointmentId = apptId,
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = Guid.NewGuid(), // different nutritionist
            Date = DateTime.UtcNow
        };
        _repoMock.Setup(r => r.GetByIdAsync(apptId)).ReturnsAsync(appt);

        var result = await _controller.GetById(apptId);

        Assert.That(result.Result, Is.InstanceOf<ForbidResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task Create_ValidDto_ReturnsCreated()
    {
        _repoMock.Setup(r => r.AddAsync(It.IsAny<MeasurementAppointment>())).Returns(Task.CompletedTask);
        _repoMock.Setup(r => r.SaveAsync()).Returns(Task.CompletedTask);

        var dto = new MeasurementAppointmentCreateDTO
        {
            MemberId = _memberId,
            EmployeeId = _trainerId,
            Date = DateTime.UtcNow.AddDays(1)
        };

        var result = await _controller.Create(dto);

        Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        var created = (CreatedAtActionResult)result.Result!;
        var outDto = (MeasurementAppointmentDTO)created.Value!;
        Assert.That(outDto.NutritionistId, Is.EqualTo(_nutritionistId));
    }

    [Test]
    public async Task Create_EmptyMemberId_ReturnsBadRequest()
    {
        var dto = new MeasurementAppointmentCreateDTO
        {
            MemberId = Guid.Empty, // invalid
            EmployeeId = _trainerId,
            Date = DateTime.UtcNow.AddDays(1)
        };

        var result = await _controller.Create(dto);

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    [Test]
    public async Task Create_EmptyEmployeeId_ReturnsBadRequest()
    {
        var dto = new MeasurementAppointmentCreateDTO
        {
            MemberId = _memberId,
            EmployeeId = Guid.Empty, // invalid
            Date = DateTime.UtcNow.AddDays(1)
        };

        var result = await _controller.Create(dto);

        Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UpdateResults
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task UpdateResults_OwnAppointment_ReturnsNoContent()
    {
        var apptId = Guid.NewGuid();
        var appt = new MeasurementAppointment
        {
            AppointmentId = apptId,
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        _repoMock.Setup(r => r.GetByIdAsync(apptId)).ReturnsAsync(appt);
        _repoMock.Setup(r => r.SaveAsync()).Returns(Task.CompletedTask);

        var dto = new MeasurementResultsDTO { WeightKg = 80, HeightCm = 180, BodyFatPercent = 20 };
        var result = await _controller.UpdateResults(apptId, dto);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
        Assert.That(appt.Measurements.WeightKg, Is.EqualTo(80));
    }

    [Test]
    public async Task UpdateResults_NonExistingId_ReturnsNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((MeasurementAppointment?)null);

        var result = await _controller.UpdateResults(Guid.NewGuid(), new MeasurementResultsDTO());

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task UpdateResults_NegativeValue_ReturnsBadRequest()
    {
        var apptId = Guid.NewGuid();
        var appt = new MeasurementAppointment
        {
            AppointmentId = apptId,
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        _repoMock.Setup(r => r.GetByIdAsync(apptId)).ReturnsAsync(appt);

        var dto = new MeasurementResultsDTO { WeightKg = -10 };
        var result = await _controller.UpdateResults(apptId, dto);

        Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Delete
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task Delete_OwnAppointment_ReturnsNoContent()
    {
        var apptId = Guid.NewGuid();
        var appt = new MeasurementAppointment
        {
            AppointmentId = apptId,
            MemberId = _memberId,
            EmployeeId = _trainerId,
            NutritionistId = _nutritionistId,
            Date = DateTime.UtcNow
        };
        _repoMock.Setup(r => r.GetByIdAsync(apptId)).ReturnsAsync(appt);
        _repoMock.Setup(r => r.SaveAsync()).Returns(Task.CompletedTask);

        var result = await _controller.Delete(apptId);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
        _repoMock.Verify(r => r.Remove(appt), Times.Once);
    }

    [Test]
    public async Task Delete_NonExistingId_ReturnsNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((MeasurementAppointment?)null);

        var result = await _controller.Delete(Guid.NewGuid());

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private static void SetUser(ControllerBase controller, Guid userId, string role)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    private static ServiceServiceClient CreateServiceClient(HttpStatusCode status)
    {
        var handler = new FakeHttpHandler(status);
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost") };
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient("ServiceService")).Returns(http);
        return new ServiceServiceClient(factory.Object);
    }

    private static LoggerServiceClient CreateLoggerClient(HttpStatusCode status)
    {
        var handler = new FakeHttpHandler(status);
        var http = new HttpClient(handler) { BaseAddress = new Uri("http://localhost") };
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient("LoggerService")).Returns(http);
        return new LoggerServiceClient(factory.Object);
    }

    private sealed class FakeHttpHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _status;
        public FakeHttpHandler(HttpStatusCode status) => _status = status;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(_status));
    }
}
