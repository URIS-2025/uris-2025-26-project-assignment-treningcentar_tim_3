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

/// <summary>
/// Unit tests for GuidelinesController with mocked IGuidelineRepository.
/// </summary>
[TestFixture]
public class GuidelinesControllerTests
{
    private Mock<IGuidelineRepository> _repoMock = null!;
    private IMapper _mapper = null!;
    private LoggerServiceClient _loggerClient = null!;
    private GuidelinesController _controller = null!;

    private Guid _nutritionistId;

    [SetUp]
    public void SetUp()
    {
        _repoMock = new Mock<IGuidelineRepository>();

        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<MeasurementProfile>());
        _mapper = mapperConfig.CreateMapper();

        _loggerClient = CreateLoggerClient(HttpStatusCode.OK);

        _nutritionistId = Guid.NewGuid();

        _controller = new GuidelinesController(_repoMock.Object, _mapper, _loggerClient);
        SetUser(_controller, _nutritionistId, "Nutritionist");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GetAll
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task GetAll_WithGuidelines_ReturnsOkWithList()
    {
        var apptId = Guid.NewGuid();
        var guidelines = new List<Guideline>
        {
            new()
            {
                GuidelineId = Guid.NewGuid(),
                AppointmentId = apptId,
                CreatedByNutritionistId = _nutritionistId,
                Title = "Test Guideline",
                Content = "Content here"
            }
        };
        _repoMock.Setup(r => r.GetAllVisibleAsync(_nutritionistId, "Nutritionist"))
            .ReturnsAsync(guidelines);

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var list = ((OkObjectResult)result.Result!).Value as IEnumerable<GuidelineDTO>;
        Assert.That(list, Is.Not.Null);
        Assert.That(list!.Count(), Is.EqualTo(1));
    }

    [Test]
    public async Task GetAll_Empty_ReturnsOkWithEmptyList()
    {
        _repoMock.Setup(r => r.GetAllVisibleAsync(_nutritionistId, "Nutritionist"))
            .ReturnsAsync(new List<Guideline>());

        var result = await _controller.GetAll();

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var list = ((OkObjectResult)result.Result!).Value as IEnumerable<GuidelineDTO>;
        Assert.That(list!.Count(), Is.EqualTo(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GetById
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task GetById_ExistingGuideline_ReturnsOk()
    {
        var guidelineId = Guid.NewGuid();
        var apptId = Guid.NewGuid();
        var guideline = new Guideline
        {
            GuidelineId = guidelineId,
            AppointmentId = apptId,
            CreatedByNutritionistId = _nutritionistId,
            Title = "My Guideline",
            Content = "Content"
        };
        _repoMock.Setup(r => r.GetAllVisibleAsync(_nutritionistId, "Nutritionist"))
            .ReturnsAsync(new List<Guideline> { guideline });

        var result = await _controller.GetById(guidelineId);

        Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        var dto = ((OkObjectResult)result.Result!).Value as GuidelineDTO;
        Assert.That(dto, Is.Not.Null);
        Assert.That(dto!.GuidelineId, Is.EqualTo(guidelineId));
    }

    [Test]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        _repoMock.Setup(r => r.GetAllVisibleAsync(_nutritionistId, "Nutritionist"))
            .ReturnsAsync(new List<Guideline>());

        var result = await _controller.GetById(Guid.NewGuid());

        Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Update
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task Update_OwnGuideline_ReturnsNoContent()
    {
        var guidelineId = Guid.NewGuid();
        var guideline = new Guideline
        {
            GuidelineId = guidelineId,
            AppointmentId = Guid.NewGuid(),
            CreatedByNutritionistId = _nutritionistId,
            Title = "Old Title",
            Content = "Old Content"
        };
        _repoMock.Setup(r => r.GetByIdAsync(guidelineId)).ReturnsAsync(guideline);
        _repoMock.Setup(r => r.SaveAsync()).Returns(Task.CompletedTask);

        var dto = new GuidelineCreateDTO
        {
            Title = "Updated Title",
            Content = "Updated Content",
            Category = GuidelineCategory.Nutrition
        };

        var result = await _controller.Update(guidelineId, dto);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
        Assert.That(guideline.Title, Is.EqualTo("Updated Title"));
        Assert.That(guideline.Category, Is.EqualTo(GuidelineCategory.Nutrition));
    }

    [Test]
    public async Task Update_NonExistingId_ReturnsNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Guideline?)null);

        var dto = new GuidelineCreateDTO { Title = "T", Content = "C", Category = GuidelineCategory.Other };
        var result = await _controller.Update(Guid.NewGuid(), dto);

        Assert.That(result, Is.InstanceOf<NotFoundResult>());
    }

    [Test]
    public async Task Update_GuidelineOfOtherNutritionist_ReturnsForbid()
    {
        var guidelineId = Guid.NewGuid();
        var guideline = new Guideline
        {
            GuidelineId = guidelineId,
            AppointmentId = Guid.NewGuid(),
            CreatedByNutritionistId = Guid.NewGuid(), // different nutritionist
            Title = "Title",
            Content = "Content"
        };
        _repoMock.Setup(r => r.GetByIdAsync(guidelineId)).ReturnsAsync(guideline);

        var dto = new GuidelineCreateDTO { Title = "T", Content = "C", Category = GuidelineCategory.Other };
        var result = await _controller.Update(guidelineId, dto);

        Assert.That(result, Is.InstanceOf<ForbidResult>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Delete
    // ─────────────────────────────────────────────────────────────────────────
    [Test]
    public async Task Delete_OwnGuideline_ReturnsNoContent()
    {
        var guidelineId = Guid.NewGuid();
        var guideline = new Guideline
        {
            GuidelineId = guidelineId,
            AppointmentId = Guid.NewGuid(),
            CreatedByNutritionistId = _nutritionistId,
            Title = "Title",
            Content = "Content"
        };
        _repoMock.Setup(r => r.GetByIdAsync(guidelineId)).ReturnsAsync(guideline);
        _repoMock.Setup(r => r.SaveAsync()).Returns(Task.CompletedTask);

        var result = await _controller.Delete(guidelineId);

        Assert.That(result, Is.InstanceOf<NoContentResult>());
        _repoMock.Verify(r => r.Remove(guideline), Times.Once);
    }

    [Test]
    public async Task Delete_NonExistingId_ReturnsNotFound()
    {
        _repoMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Guideline?)null);

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
