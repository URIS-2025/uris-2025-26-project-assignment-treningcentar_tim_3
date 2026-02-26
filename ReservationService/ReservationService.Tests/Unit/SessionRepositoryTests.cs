using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using NUnit.Framework;
using ReservationService.Context;
using ReservationService.Data;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Models.DTO.MemberDtos;
using ReservationService.Models.Enums;
using ReservationService.Profiles;
using ReservationService.ServiceCalls.Logger;
using ReservationService.ServiceCalls.User;
using ReservationService.Models.DTO.LogDtos;

namespace ReservationService.Tests.Unit
{
    [TestFixture]
    public class SessionRepositoryTests
    {
        private ReservationContext _context = null!;
        private IMapper _mapper = null!;
        private Mock<IUserService> _userServiceMock = null!;
        private Mock<IServiceLogger> _loggerMock = null!;
        private SessionRepository _repository = null!;

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

            _repository = new SessionRepository(_context, _mapper, _userServiceMock.Object, _loggerMock.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // Proverava da GetAll vraca praznu listu kada nema sesija u bazi
        [Test]
        public void GetAllSessions_WhenEmpty_ReturnsEmptyList()
        {
            var result = _repository.GetAllSessions();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(0));
        }

        // Proverava da GetAll vraca i personalne i grupne sesije
        [Test]
        public void GetAllSessions_ReturnsBothTypes()
        {
            var trainerId = Guid.NewGuid();
            var hallId = Guid.NewGuid();

            _context.Sessions.AddRange(
                new PersonalSession
                {
                    sessionId = Guid.NewGuid(), name = "Personal 1", StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                    trainingType = TrainingType.Strength, trainerId = trainerId
                },
                new GroupSession
                {
                    sessionId = Guid.NewGuid(), name = "Group 1", StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                    trainingType = TrainingType.Yoga, trainerId = trainerId, maxCapacity = 20, trainingHallId = hallId
                }
            );
            _context.SaveChanges();

            var result = _repository.GetAllSessions();

            Assert.That(result.Count(), Is.EqualTo(2));
        }

        // Filtrira i vraca samo personalne sesije, ne i grupne
        [Test]
        public void GetPersonalSessions_ReturnsOnlyPersonal()
        {
            var trainerId = Guid.NewGuid();
            var hallId = Guid.NewGuid();

            _context.Sessions.AddRange(
                new PersonalSession
                {
                    sessionId = Guid.NewGuid(), name = "Personal Only", StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                    trainingType = TrainingType.Strength, trainerId = trainerId
                },
                new GroupSession
                {
                    sessionId = Guid.NewGuid(), name = "Group Only", StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                    trainingType = TrainingType.Yoga, trainerId = trainerId, maxCapacity = 10, trainingHallId = hallId
                }
            );
            _context.SaveChanges();

            var result = _repository.GetPersonalSessions();

            Assert.That(result.Count(), Is.EqualTo(1));
            Assert.That(result.First().Name, Is.EqualTo("Personal Only"));
        }

        // Filtrira i vraca samo grupne sesije, ne i personalne
        [Test]
        public void GetGroupSessions_ReturnsOnlyGroup()
        {
            var trainerId = Guid.NewGuid();
            var hallId = Guid.NewGuid();

            _context.Sessions.AddRange(
                new PersonalSession
                {
                    sessionId = Guid.NewGuid(), name = "Personal Only", StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                    trainingType = TrainingType.Strength, trainerId = trainerId
                },
                new GroupSession
                {
                    sessionId = Guid.NewGuid(), name = "Group Only", StartTime = DateTime.UtcNow,
                    EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                    trainingType = TrainingType.Pilates, trainerId = trainerId, maxCapacity = 15, trainingHallId = hallId
                }
            );
            _context.SaveChanges();

            var result = _repository.GetGroupSessions();

            Assert.That(result.Count(), Is.EqualTo(1));
            Assert.That(result.First().Name, Is.EqualTo("Group Only"));
        }

        // Vraca sesiju po ID-u sa svim podacima kada postoji u bazi
        [Test]
        public void GetSessionById_WhenExists_ReturnsSession()
        {
            var sessionId = Guid.NewGuid();
            var trainerId = Guid.NewGuid();

            _context.Sessions.Add(new PersonalSession
            {
                sessionId = sessionId, name = "Test Session", StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                trainingType = TrainingType.Cardio, trainerId = trainerId
            });
            _context.SaveChanges();

            var result = _repository.GetSessionById(sessionId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.SessionId, Is.EqualTo(sessionId));
            Assert.That(result.Name, Is.EqualTo("Test Session"));
        }

        // Vraca null kada sesija sa datim ID-em ne postoji
        [Test]
        public void GetSessionById_WhenNotFound_ReturnsNull()
        {
            var result = _repository.GetSessionById(Guid.NewGuid());

            Assert.That(result, Is.Null);
        }

        // Kreira personalnu sesiju sa validnim trenerom i proverava da nema maxCapacity
        [Test]
        public void AddSession_PersonalSession_CreatesSuccessfully()
        {
            var trainerId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "Trainer", LastName = "One", Username = "trainer1", Email = "trainer@test.com" });

            var dto = new SessionCreateDTO
            {
                Name = "New Personal",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming,
                TrainingType = TrainingType.Strength,
                TrainerId = trainerId,
                IsGroup = false
            };

            var result = _repository.AddSession(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Name, Is.EqualTo("New Personal"));
            Assert.That(result.TrainerName, Is.EqualTo("Trainer One"));
            Assert.That(result.MaxCapacity, Is.Null);
            Assert.That(_context.Sessions.Count(), Is.EqualTo(1));
        }

        // Kreira grupnu sesiju sa kapacitetom i dodeljenom dvoranom
        [Test]
        public void AddSession_GroupSession_CreatesWithCapacityAndHall()
        {
            var trainerId = Guid.NewGuid();
            var hallId = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "Coach", LastName = "Mike", Username = "coach", Email = "coach@test.com" });

            _context.TrainingHalls.Add(new TrainingHall
            {
                trainingHallId = hallId,
                trainingHallName = "Sala A",
                Capacity = 50
            });
            _context.SaveChanges();

            var dto = new SessionCreateDTO
            {
                Name = "Grupni Yoga",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming,
                TrainingType = TrainingType.Yoga,
                TrainerId = trainerId,
                IsGroup = true,
                MaxCapacity = 25,
                TrainingHallId = hallId
            };

            var result = _repository.AddSession(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Name, Is.EqualTo("Grupni Yoga"));
            Assert.That(result.MaxCapacity, Is.EqualTo(25));
            Assert.That(result.TrainingHallId, Is.EqualTo(hallId));
            Assert.That(result.TrainingHallName, Is.EqualTo("Sala A"));
        }

        // Proverava da kreiranje sesije sa nepostojecim trenerom baca KeyNotFoundException
        [Test]
        public void AddSession_WithInvalidTrainer_ThrowsKeyNotFoundException()
        {
            _userServiceMock.Setup(u => u.GetUserById(It.IsAny<Guid>()))
                .Returns((MemberDto)null!);

            var dto = new SessionCreateDTO
            {
                Name = "Bad Session",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming,
                TrainingType = TrainingType.HIIT,
                TrainerId = Guid.NewGuid(),
                IsGroup = false
            };

            Assert.Throws<KeyNotFoundException>(() => _repository.AddSession(dto));
        }

        // Azurira polja postojece sesije (status, tip treninga) i proverava promene
        [Test]
        public void UpdateSession_WhenExists_UpdatesFields()
        {
            var sessionId = Guid.NewGuid();
            var trainerId = Guid.NewGuid();

            _context.Sessions.Add(new PersonalSession
            {
                sessionId = sessionId, name = "Old Name", StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                trainingType = TrainingType.Strength, trainerId = trainerId
            });
            _context.SaveChanges();

            _userServiceMock.Setup(u => u.GetUserById(trainerId))
                .Returns(new MemberDto { FirstName = "Trainer", LastName = "X", Username = "tx", Email = "tx@test.com" });

            var dto = new SessionUpdateDTO
            {
                SessionId = sessionId,
                Name = "Old Name",
                StartTime = DateTime.UtcNow.AddDays(1),
                EndTime = DateTime.UtcNow.AddDays(1).AddHours(2),
                Status = SessionStatus.Finished,
                TrainingType = TrainingType.Cardio,
                TrainerId = trainerId
            };

            var result = _repository.UpdateSession(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Status, Is.EqualTo(SessionStatus.Finished));
            Assert.That(result.TrainingType, Is.EqualTo(TrainingType.Cardio));
        }

        // Proverava da update nepostojece sesije baca KeyNotFoundException
        [Test]
        public void UpdateSession_WhenNotFound_ThrowsKeyNotFoundException()
        {
            _userServiceMock.Setup(u => u.GetUserById(It.IsAny<Guid>()))
                .Returns(new MemberDto { FirstName = "T", LastName = "T", Username = "t", Email = "t@t.com" });

            var dto = new SessionUpdateDTO
            {
                SessionId = Guid.NewGuid(),
                Name = "Nope",
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1),
                Status = SessionStatus.Upcoming,
                TrainingType = TrainingType.Boxing,
                TrainerId = Guid.NewGuid()
            };

            Assert.Throws<KeyNotFoundException>(() => _repository.UpdateSession(dto));
        }

        // Brise sesiju iz baze i proverava da je uklonjena
        [Test]
        public void DeleteSession_WhenExists_RemovesFromDatabase()
        {
            var sessionId = Guid.NewGuid();
            _context.Sessions.Add(new PersonalSession
            {
                sessionId = sessionId, name = "To Delete", StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming,
                trainingType = TrainingType.Stretching, trainerId = Guid.NewGuid()
            });
            _context.SaveChanges();

            _repository.DeleteSession(sessionId);

            Assert.That(_context.Sessions.Count(), Is.EqualTo(0));
        }

        // Proverava da brisanje nepostojece sesije ne baca exception
        [Test]
        public void DeleteSession_WhenNotFound_DoesNotThrow()
        {
            Assert.DoesNotThrow(() => _repository.DeleteSession(Guid.NewGuid()));
        }
    }
}
