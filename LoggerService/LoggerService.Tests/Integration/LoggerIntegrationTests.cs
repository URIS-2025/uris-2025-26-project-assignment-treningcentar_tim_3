using AutoMapper;
using LoggerService.Context;
using LoggerService.Controllers;
using LoggerService.Data;
using LoggerService.Models.DTO;
using LoggerService.Models.Enums;
using LoggerService.Profiles;
using LoggerService.Tests.Context;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace LoggerService.Tests.Integration
{
    [TestFixture]
    public class LoggerIntegrationTests
    {
        private LoggerContext _context = null!;
        private ILoggerRepository _repository = null!;
        private IMapper _mapper = null!;
        private LoggerController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<LoggerContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            var cfg = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>())
                .Build();

            _context = new TestLoggerContext(options, cfg);
            _repository = new LoggerRepository(_context, CreateMapper());

            _controller = new LoggerController(_repository);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            _context.Database.EnsureCreated();
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public void CreateLog_ThenGetById_ReturnsCreatedLog()
        {
            var dto = new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "ServiceService",
                Action = "Create",
                Message = "Created something",
                Details = "details",
                CorrelationId = "corr-1",
                EntityType = "Service",
                EntityId = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                TimestampUtc = null 
            };

            // CREATE
            var createResult = _controller.Create(dto);
            Assert.That(createResult.Result, Is.InstanceOf<CreatedAtActionResult>());

            var created = ((CreatedAtActionResult)createResult.Result!).Value as LogDTO;
            Assert.That(created, Is.Not.Null);
            Assert.That(created!.Id, Is.Not.EqualTo(Guid.Empty));
            Assert.That(created.ServiceName, Is.EqualTo("ServiceService"));
            Assert.That(created.Action, Is.EqualTo("Create"));
            Assert.That(created.Level, Is.EqualTo(LogLevels.Info));
            Assert.That(created.Message, Is.EqualTo("Created something"));

            // GET BY ID
            var getResult = _controller.GetById(created.Id);
            Assert.That(getResult.Result, Is.InstanceOf<OkObjectResult>());

            var fetched = ((OkObjectResult)getResult.Result!).Value as LogDTO;
            Assert.That(fetched, Is.Not.Null);
            Assert.That(fetched!.Id, Is.EqualTo(created.Id));
            Assert.That(fetched.Details, Is.EqualTo("details"));
            Assert.That(fetched.CorrelationId, Is.EqualTo("corr-1"));
            Assert.That(fetched.EntityType, Is.EqualTo("Service"));
            Assert.That(fetched.EntityId, Is.EqualTo(dto.EntityId));
            Assert.That(fetched.UserId, Is.EqualTo(dto.UserId));
        }

        [Test]
        public void CreateLog_ThenGetAll_ContainsLog()
        {
            _controller.Create(new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "ServiceService",
                Action = "Create",
                Message = "Test"
            });

            var result = _controller.GetAll();

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());

            var logs = ((OkObjectResult)result.Result!).Value as IEnumerable<LogDTO>;
            Assert.That(logs!.Count(), Is.EqualTo(1));
        }

        [Test]
        public void CreateLog_ThenDelete_ThenGetById_ReturnsNotFound()
        {
            var create = _controller.Create(new LogCreationDTO
            {
                Level = LogLevels.Info,
                ServiceName = "ServiceService",
                Action = "Delete",
                Message = "To delete"
            });

            var created = ((CreatedAtActionResult)create.Result!).Value as LogDTO;

            var deleteResult = _controller.Delete(created!.Id);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());

            var getResult = _controller.GetById(created.Id);
            Assert.That(getResult.Result, Is.InstanceOf<NotFoundResult>());
        }

        private static IMapper CreateMapper()
        {
            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile(new LoggerProfile());
            }, NullLoggerFactory.Instance);

            return mapperConfig.CreateMapper();
        }
    }
}

