using LoggerService.Controllers;
using LoggerService.Data;
using LoggerService.Models.DTO;
using LoggerService.Models.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;


namespace LoggerService.Tests.Unit
{
    [TestFixture]
    public class LoggerControllerTests
    {
        private Mock<ILoggerRepository> _repoMock = null!;
        private LoggerController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            _repoMock = new Mock<ILoggerRepository>();
            _controller = new LoggerController(_repoMock.Object);
        }

        #region GetAll

        [Test]
        public void GetAll_WhenLogsExist_ReturnsOkWithLogs()
        {
            var logs = new List<LogDTO>
            {
                new LogDTO
                {
                    Id = Guid.NewGuid(),
                    Level = LogLevels.Info,
                    ServiceName = "ServiceService",
                    Action = "Create",
                    Message = "Created entity",
                    TimestampUtc = DateTime.UtcNow
                },
                new LogDTO
                {
                    Id = Guid.NewGuid(),
                    Level = LogLevels.Error,
                    ServiceName = "PaymentService",
                    Action = "Pay",
                    Message = "Payment failed",
                    TimestampUtc = DateTime.UtcNow
                }
            };

            _repoMock.Setup(r => r.GetAll(It.IsAny<int>())).Returns(logs);

            var result = _controller.GetAll(take: 100);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var data = ok!.Value as IEnumerable<LogDTO>;
            Assert.That(data!.Count(), Is.EqualTo(2));
        }

        [Test]
        public void GetAll_WhenEmpty_ReturnsNoContent()
        {
            _repoMock.Setup(r => r.GetAll(It.IsAny<int>())).Returns(new List<LogDTO>());

            var result = _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public void GetAll_WhenNull_ReturnsNoContent()
        {
            _repoMock.Setup(r => r.GetAll(It.IsAny<int>())).Returns((IEnumerable<LogDTO>)null!);

            var result = _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        #endregion

        #region GetById

        [Test]
        public void GetById_WhenFound_ReturnsOk()
        {
            var id = Guid.NewGuid();
            var dto = new LogDTO
            {
                Id = id,
                Level = LogLevels.Warning,
                ServiceName = "ReservationService",
                Action = "Update",
                Message = "Updated reservation",
                TimestampUtc = DateTime.UtcNow
            };

            _repoMock.Setup(r => r.GetById(id)).Returns(dto);

            var result = _controller.GetById(id);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var ok = result.Result as OkObjectResult;
            var returned = ok!.Value as LogDTO;

            Assert.That(returned, Is.Not.Null);
            Assert.That(returned!.Id, Is.EqualTo(id));
        }

        [Test]
        public void GetById_WhenNotFound_ReturnsNotFound()
        {
            _repoMock.Setup(r => r.GetById(It.IsAny<Guid>())).Returns((LogDTO?)null);

            var result = _controller.GetById(Guid.NewGuid());

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        #endregion

        #region Search

        [Test]
        public void Search_WhenResultsExist_ReturnsOkWithResults()
        {
            var resultLogs = new List<LogDTO>
            {
                new LogDTO
                {
                    Id = Guid.NewGuid(),
                    Level = LogLevels.Error,
                    ServiceName = "ServiceService",
                    Action = "Create",
                    Message = "DB error",
                    TimestampUtc = DateTime.UtcNow
                }
            };

            _repoMock
                .Setup(r => r.Search(
                    It.IsAny<LogLevels?>(),
                    It.IsAny<string?>(),
                    It.IsAny<string?>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<int>()))
                .Returns(resultLogs);

            var res = _controller.Search(
                level: LogLevels.Error,
                serviceName: "ServiceService",
                action: "Create",
                entityId: null,
                fromUtc: DateTime.UtcNow.AddDays(-1),
                toUtc: DateTime.UtcNow,
                take: 100);

            Assert.That(res.Result, Is.InstanceOf<OkObjectResult>());
            var ok = res.Result as OkObjectResult;
            var data = ok!.Value as IEnumerable<LogDTO>;
            Assert.That(data!.Count(), Is.EqualTo(1));
        }

        [Test]
        public void Search_WhenEmpty_ReturnsNoContent()
        {
            _repoMock
                .Setup(r => r.Search(
                    It.IsAny<LogLevels?>(),
                    It.IsAny<string?>(),
                    It.IsAny<string?>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<int>()))
                .Returns(new List<LogDTO>());

            var res = _controller.Search(null, null, null, null, null, null, 100);

            Assert.That(res.Result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public void Search_WhenNull_ReturnsNoContent()
        {
            _repoMock
                .Setup(r => r.Search(
                    It.IsAny<LogLevels?>(),
                    It.IsAny<string?>(),
                    It.IsAny<string?>(),
                    It.IsAny<Guid?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<DateTime?>(),
                    It.IsAny<int>()))
                .Returns((IEnumerable<LogDTO>)null!);

            var res = _controller.Search(null, null, null, null, null, null, 100);

            Assert.That(res.Result, Is.InstanceOf<NoContentResult>());
        }

        #endregion

        #region Create

        [Test]
        public void Create_ValidDto_ReturnsCreatedAtAction()
        {
            var createdId = Guid.NewGuid();

            var dto = new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "ServiceService",
                Action = "Create",
                Message = "Created entity",
                EntityId = Guid.NewGuid(),
                TimestampUtc = DateTime.UtcNow
            };

            var createdDto = new LogDTO
            {
                Id = createdId,
                Level = dto.Level,
                ServiceName = dto.ServiceName,
                Action = dto.Action,
                Message = dto.Message,
                EntityId = dto.EntityId,
                TimestampUtc = dto.TimestampUtc ?? DateTime.UtcNow
            };

            _repoMock.Setup(r => r.Create(dto)).Returns(createdDto);

            var result = _controller.Create(dto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var created = result.Result as CreatedAtActionResult;

            Assert.That(created!.ActionName, Is.EqualTo(nameof(LoggerController.GetById)));
            Assert.That(created.Value, Is.InstanceOf<LogDTO>());
        }

        [Test]
        public void Create_WhenRepositoryThrows_ReturnsBadRequest()
        {
            var dto = new LogCreationDTO
            {
                Level = LogLevels.Error,
                ServiceName = "ServiceService",
                Action = "Create",
                Message = "DB error"
            };

            _repoMock.Setup(r => r.Create(dto)).Throws(new Exception("DB error"));

            var result = _controller.Create(dto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public void Create_InvalidModelState_ReturnsBadRequest()
        {
            _controller.ModelState.AddModelError("Message", "Required");

            var result = _controller.Create(new LogCreationDTO());

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        #endregion

        #region Delete

        [Test]
        public void Delete_WhenNotFound_ReturnsNotFound()
        {
            _repoMock.Setup(r => r.GetById(It.IsAny<Guid>())).Returns((LogDTO?)null);

            var result = _controller.Delete(Guid.NewGuid());

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public void Delete_Existing_ReturnsNoContent_AndCallsRepository()
        {
            var id = Guid.NewGuid();
            _repoMock.Setup(r => r.GetById(id)).Returns(new LogDTO { Id = id, Level = LogLevels.Info, ServiceName = "LoggerService", Action = "Delete", Message = "ok", TimestampUtc = DateTime.UtcNow });

            var result = _controller.Delete(id);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            _repoMock.Verify(r => r.Delete(id), Times.Once);
        }

        #endregion

        #region Options

        [Test]
        public void GetOptions_ReturnsOk_AndSetsAllowHeader()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = _controller.GetOptions();

            Assert.That(result, Is.InstanceOf<OkResult>());
            Assert.That(_controller.Response.Headers["Allow"].ToString(),
                Is.EqualTo("GET, HEAD, POST, DELETE, OPTIONS"));
        }

        #endregion
    }
}

