using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using ReservationService.Context;
using ReservationService.Controllers;
using ReservationService.Data;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Models.DTO.MemberDtos;
using ReservationService.Models.DTO.LogDtos;
using ReservationService.Models.Enums;
using ReservationService.Profiles;
using ReservationService.ServiceCalls.Logger;
using ReservationService.ServiceCalls.User;

namespace ReservationService.Tests.Integration
{
    [TestFixture]
    public class SessionIntegrationTests
    {
        private ReservationContext _context = null!;
        private IMapper _mapper = null!;
        private Mock<IUserService> _userServiceMock = null!;
        private Mock<IServiceLogger> _loggerMock = null!;
        private SessionRepository _sessionRepository = null!;
        private SessionController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<ReservationContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new TestReservationContext(options);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<SessionProfile>();
                cfg.AddProfile<ReservationProfile>();
                cfg.AddProfile<TrainingHallProfile>();
            });
            _mapper = mapperConfig.CreateMapper();

            _userServiceMock = new Mock<IUserService>();
            _loggerMock = new Mock<IServiceLogger>();
            _loggerMock.Setup(l => l.CreateLog(It.IsAny<LogCreationDto>()))
                .Returns((LogDto)null!);

            _sessionRepository = new SessionRepository(_context, _mapper, _userServiceMock.Object, _loggerMock.Object);
            _controller = new SessionController(_sessionRepository, _mapper);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        [TearDown]
        public void TearDown()
        {
            _controller.Dispose();
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // Kreira personalnu sesiju i dohvata
        [Test]
        public void CreatePersonalSession_ThenGetById_ReturnsCreated()
        {
            var trainerId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "Trainer", LastName = "One", Username = "t1", Email = "t1@test.com" });

            var createDto = new SessionCreateDTO
            {
                Name = "Personal Strength",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(1).AddHours(1),
                Status = SessionStatus.Upcoming,
                TrainingType = TrainingType.Strength,
                TrainerId = trainerId,
                IsGroup = false
            };

            var createResult = _controller.AddSession(createDto);
            Assert.That(createResult.Result, Is.InstanceOf<CreatedResult>());
            var created = ((CreatedResult)createResult.Result!).Value as SessionConfirmationDto;
            Assert.That(created, Is.Not.Null);

            var getResult = _controller.GetSessionById(created!.SessionId);
            Assert.That(getResult.Result, Is.InstanceOf<OkObjectResult>());
            var fetched = ((OkObjectResult)getResult.Result!).Value as SessionDto;
            Assert.That(fetched, Is.Not.Null);
            Assert.That(fetched!.Name, Is.EqualTo("Personal Strength"));
        }

        // Kreira grupnu sesiju sa kapacitetom i dvoranom
        [Test]
        public void CreateGroupSession_ThenGetById_ReturnsWithCapacity()
        {
            var trainerId = Guid.NewGuid();
            var hallId = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "Coach", LastName = "Mike", Username = "cm", Email = "cm@test.com" });

            _context.TrainingHalls.Add(new TrainingHall
            {
                trainingHallId = hallId,
                trainingHallName = "Hall A",
                Capacity = 50
            });
            _context.SaveChanges();

            var createDto = new SessionCreateDTO
            {
                Name = "Group Yoga",
                StartTime = DateTime.UtcNow.AddDays(2),
                EndTime = DateTime.UtcNow.AddDays(2).AddHours(1),
                Status = SessionStatus.Upcoming,
                TrainingType = TrainingType.Yoga,
                TrainerId = trainerId,
                IsGroup = true,
                MaxCapacity = 25,
                TrainingHallId = hallId
            };

            var createResult = _controller.AddSession(createDto);
            Assert.That(createResult.Result, Is.InstanceOf<CreatedResult>());
            var created = ((CreatedResult)createResult.Result!).Value as SessionConfirmationDto;

            Assert.That(created!.MaxCapacity, Is.EqualTo(25));
            Assert.That(created.TrainingHallName, Is.EqualTo("Hall A"));

            var getResult = _controller.GetSessionById(created.SessionId);
            var fetched = ((OkObjectResult)getResult.Result!).Value as SessionDto;
            Assert.That(fetched!.MaxCapacity, Is.EqualTo(25));
            Assert.That(fetched.TrainingHallId, Is.EqualTo(hallId));
        }

        // POST /api/session sa nepostojecim trenerom - ocekuje BadRequest
        [Test]
        public void CreateSession_WithInvalidTrainer_ReturnsBadRequest()
        {
            _userServiceMock.Setup(u => u.GetUserById(It.IsAny<Guid>()))
                .Returns((MemberDto)null!);

            var createDto = new SessionCreateDTO
            {
                Name = "Bad Session",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming,
                TrainingType = TrainingType.HIIT,
                TrainerId = Guid.NewGuid(),
                IsGroup = false
            };

            var result = _controller.AddSession(createDto);
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        // Kreira dve sesije i proverava GetAll
        [Test]
        public void CreateSession_ThenGetAll_ContainsCreatedSession()
        {
            var trainerId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "T", LastName = "T", Username = "tt", Email = "tt@test.com" });

            _controller.AddSession(new SessionCreateDTO
            {
                Name = "Session A", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming, TrainingType = TrainingType.Cardio,
                TrainerId = trainerId, IsGroup = false
            });
            _controller.AddSession(new SessionCreateDTO
            {
                Name = "Session B", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming, TrainingType = TrainingType.Boxing,
                TrainerId = trainerId, IsGroup = false
            });

            var listResult = _controller.GetAllSessions();
            Assert.That(listResult.Result, Is.InstanceOf<OkObjectResult>());
            var sessions = ((OkObjectResult)listResult.Result!).Value as IEnumerable<SessionDto>;
            Assert.That(sessions!.Count(), Is.EqualTo(2));
        }

        // GET /api/session kada je baza prazna - ocekuje NoContent
        [Test]
        public void GetAllSessions_WhenEmpty_ReturnsNoContent()
        {
            var result = _controller.GetAllSessions();
            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        // Kreira sesiju pa azurira status i tip treninga
        [Test]
        public void CreateSession_ThenUpdate_ChangesFields()
        {
            var trainerId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "T", LastName = "T", Username = "tt", Email = "tt@test.com" });

            var createResult = _controller.AddSession(new SessionCreateDTO
            {
                Name = "Original", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming, TrainingType = TrainingType.Strength,
                TrainerId = trainerId, IsGroup = false
            });
            var created = ((CreatedResult)createResult.Result!).Value as SessionConfirmationDto;

            var updateResult = _controller.UpdateSession(new SessionUpdateDTO
            {
                SessionId = created!.SessionId,
                Name = "Original",
                StartTime = DateTime.UtcNow.AddDays(5),
                EndTime = DateTime.UtcNow.AddDays(5).AddHours(2),
                Status = SessionStatus.Finished,
                TrainingType = TrainingType.Cardio,
                TrainerId = trainerId
            });

            Assert.That(updateResult.Result, Is.InstanceOf<OkObjectResult>());
            var updated = ((OkObjectResult)updateResult.Result!).Value as SessionConfirmationDto;
            Assert.That(updated!.Status, Is.EqualTo(SessionStatus.Finished));
            Assert.That(updated.TrainingType, Is.EqualTo(TrainingType.Cardio));

            var dbSession = _context.Sessions.First(s => s.sessionId == created.SessionId);
            Assert.That(dbSession.status, Is.EqualTo(SessionStatus.Finished));
        }

        // PUT /api/session sa nepostojecim ID-em - ocekuje NotFound
        [Test]
        public void UpdateSession_WhenNotFound_ReturnsNotFound()
        {
            _userServiceMock.Setup(u => u.GetUserById(It.IsAny<Guid>()))
                .Returns(new MemberDto { FirstName = "T", LastName = "T", Username = "tt", Email = "tt@test.com" });

            var result = _controller.UpdateSession(new SessionUpdateDTO
            {
                SessionId = Guid.NewGuid(),
                Name = "Nope",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming,
                TrainingType = TrainingType.Boxing,
                TrainerId = Guid.NewGuid()
            });

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        // Brise sesiju i proverava da ne postoji
        [Test]
        public void CreateSession_ThenDelete_ThenGetById_ReturnsNotFound()
        {
            var trainerId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "T", LastName = "T", Username = "tt", Email = "tt@test.com" });

            var createResult = _controller.AddSession(new SessionCreateDTO
            {
                Name = "To Delete", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming, TrainingType = TrainingType.Stretching,
                TrainerId = trainerId, IsGroup = false
            });
            var created = ((CreatedResult)createResult.Result!).Value as SessionConfirmationDto;

            var deleteResult = _controller.DeleteSession(created!.SessionId);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());

            var getResult = _controller.GetSessionById(created.SessionId);
            Assert.That(getResult.Result, Is.InstanceOf<NotFoundResult>());
            Assert.That(_context.Sessions.Count(), Is.EqualTo(0));
        }

        // DELETE /api/session/{id} sa nepostojecim ID-em - ocekuje NotFound
        [Test]
        public void DeleteSession_WhenNotFound_ReturnsNotFound()
        {
            var result = _controller.DeleteSession(Guid.NewGuid());
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        // Kompletan zivotni ciklus sesije: POST -> PUT -> DELETE
        [Test]
        public void FullSessionLifecycle_Create_Update_Delete()
        {
            var trainerId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "Coach", LastName = "Full", Username = "cf", Email = "cf@test.com" });

            // Create
            var createResult = _controller.AddSession(new SessionCreateDTO
            {
                Name = "Lifecycle Session", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming, TrainingType = TrainingType.Functional,
                TrainerId = trainerId, IsGroup = false
            });
            var created = ((CreatedResult)createResult.Result!).Value as SessionConfirmationDto;
            Assert.That(created!.Status, Is.EqualTo(SessionStatus.Upcoming));

            // Update to finished
            var updateResult = _controller.UpdateSession(new SessionUpdateDTO
            {
                SessionId = created.SessionId, Name = "Lifecycle Session",
                StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Finished, TrainingType = TrainingType.Functional,
                TrainerId = trainerId
            });
            var updated = ((OkObjectResult)updateResult.Result!).Value as SessionConfirmationDto;
            Assert.That(updated!.Status, Is.EqualTo(SessionStatus.Finished));

            // Delete
            var deleteResult = _controller.DeleteSession(created.SessionId);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());
            Assert.That(_context.Sessions.Count(), Is.EqualTo(0));
        }

        // Filtriranje po tipu sesije
        [Test]
        public void GetPersonalSessions_ReturnsOnlyPersonalFromController()
        {
            var trainerId = Guid.NewGuid();
            var hallId = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "T", LastName = "T", Username = "tt", Email = "tt@test.com" });

            _context.TrainingHalls.Add(new TrainingHall { trainingHallId = hallId, trainingHallName = "H1", Capacity = 30 });
            _context.SaveChanges();

            _controller.AddSession(new SessionCreateDTO
            {
                Name = "Personal One", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming, TrainingType = TrainingType.Strength,
                TrainerId = trainerId, IsGroup = false
            });
            _controller.AddSession(new SessionCreateDTO
            {
                Name = "Group One", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming, TrainingType = TrainingType.Yoga,
                TrainerId = trainerId, IsGroup = true, MaxCapacity = 20, TrainingHallId = hallId
            });

            var personalResult = _controller.GetPersonalSessions();
            Assert.That(personalResult.Result, Is.InstanceOf<OkObjectResult>());
            var personalSessions = ((OkObjectResult)personalResult.Result!).Value as IEnumerable<SessionDto>;
            Assert.That(personalSessions!.Count(), Is.EqualTo(1));
            Assert.That(personalSessions.First().Name, Is.EqualTo("Personal One"));

            var groupResult = _controller.GetGroupSessions();
            Assert.That(groupResult.Result, Is.InstanceOf<OkObjectResult>());
            var groupSessions = ((OkObjectResult)groupResult.Result!).Value as IEnumerable<SessionDto>;
            Assert.That(groupSessions!.Count(), Is.EqualTo(1));
            Assert.That(groupSessions.First().Name, Is.EqualTo("Group One"));
        }
    }
}
