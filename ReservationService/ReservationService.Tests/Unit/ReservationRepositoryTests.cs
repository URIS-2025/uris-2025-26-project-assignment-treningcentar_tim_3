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
    public class ReservationRepositoryTests
    {
        private ReservationContext _context = null!;
        private IMapper _mapper = null!;
        private Mock<IUserService> _userServiceMock = null!;
        private Mock<IServiceLogger> _loggerMock = null!;
        private ReservationRepository _repository = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<ReservationContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new TestReservationContext(options);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<ReservationProfile>();
                cfg.AddProfile<SessionProfile>();
            });
            _mapper = mapperConfig.CreateMapper();

            _userServiceMock = new Mock<IUserService>();
            _loggerMock = new Mock<IServiceLogger>();
            _loggerMock.Setup(l => l.CreateLog(It.IsAny<LogCreationDto>()))
                .Returns((LogDto)null!);

            _repository = new ReservationRepository(_context, _mapper, _userServiceMock.Object, _loggerMock.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // Proverava da GetAll vraca praznu listu kada nema rezervacija u bazi
        [Test]
        public void GetAllReservations_WhenEmpty_ReturnsEmptyList()
        {
            var result = _repository.GetAllReservations();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(0));
        }

        // Proverava da GetAll vraca sve rezervacije kada postoje u bazi
        [Test]
        public void GetAllReservations_WhenReservationsExist_ReturnsAll()
        {
            var userId = Guid.NewGuid();
            var sessionId = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Marko", LastName = "Markovic", Username = "marko", Email = "marko@test.com" });

            _context.Reservations.AddRange(
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = sessionId, status = ReservationStatus.Booked },
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = Guid.NewGuid(), status = ReservationStatus.Booked }
            );
            _context.SaveChanges();

            var result = _repository.GetAllReservations();

            Assert.That(result.Count(), Is.EqualTo(2));
        }

        // Proverava da GetById vraca rezervaciju sa svim podacima kada postoji
        [Test]
        public void GetReservationById_WhenExists_ReturnsReservation()
        {
            var reservationId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Ana", LastName = "Anic", Username = "ana", Email = "ana@test.com" });

            _context.Reservations.Add(new Reservation
            {
                reservationId = reservationId,
                userId = userId,
                sessionId = Guid.NewGuid(),
                status = ReservationStatus.Booked
            });
            _context.SaveChanges();

            var result = _repository.GetReservationById(reservationId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.ReservationId, Is.EqualTo(reservationId));
            Assert.That(result.Member.FirstName, Is.EqualTo("Ana"));
        }

        // Proverava da GetById vraca null kada rezervacija ne postoji
        [Test]
        public void GetReservationById_WhenNotFound_ReturnsNull()
        {
            var result = _repository.GetReservationById(Guid.NewGuid());

            Assert.That(result, Is.Null);
        }

        // Kreira rezervaciju za validnog korisnika i proverava da se sacuva u bazi sa statusom Booked
        [Test]
        public void CreateReservation_WithValidUser_CreatesAndReturnsConfirmation()
        {
            var userId = Guid.NewGuid();
            var sessionId = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Petar", LastName = "Petrovic", Username = "petar", Email = "petar@test.com" });

            var dto = new ReservationCreateDto
            {
                UserId = userId,
                SessionId = sessionId
            };

            var result = _repository.CreateReservation(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.UserName, Is.EqualTo("Petar Petrovic"));
            Assert.That(result.SessionId, Is.EqualTo(sessionId));
            Assert.That(_context.Reservations.Count(), Is.EqualTo(1));
            Assert.That(_context.Reservations.First().status, Is.EqualTo(ReservationStatus.Booked));
        }

        // Proverava da kreiranje rezervacije za nepostojeceg korisnika baca KeyNotFoundException
        [Test]
        public void CreateReservation_WithInvalidUser_ThrowsKeyNotFoundException()
        {
            _userServiceMock.Setup(u => u.GetUserById(It.IsAny<Guid>()))
                .Returns((MemberDto)null!);

            var dto = new ReservationCreateDto
            {
                UserId = Guid.NewGuid(),
                SessionId = Guid.NewGuid()
            };

            Assert.Throws<KeyNotFoundException>(() => _repository.CreateReservation(dto));
        }

        // Azurira postojecu rezervaciju i proverava da su polja promenjena
        [Test]
        public void UpdateReservation_WhenExists_UpdatesAndReturnsConfirmation()
        {
            var reservationId = Guid.NewGuid();
            var userId = Guid.NewGuid();
            var newSessionId = Guid.NewGuid();

            _context.Reservations.Add(new Reservation
            {
                reservationId = reservationId,
                userId = userId,
                sessionId = Guid.NewGuid(),
                status = ReservationStatus.Booked
            });
            _context.SaveChanges();

            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Jovan", LastName = "Jovanovic", Username = "jovan", Email = "jovan@test.com" });

            var dto = new ReservationUpdateDto
            {
                ReservationId = reservationId,
                UserId = userId,
                SessionId = newSessionId,
                Status = ReservationStatus.Canceled
            };

            var result = _repository.UpdateReservation(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.SessionId, Is.EqualTo(newSessionId));
            Assert.That(result.Status, Is.EqualTo(ReservationStatus.Canceled));
        }

        // Proverava da update nepostojece rezervacije baca KeyNotFoundException
        [Test]
        public void UpdateReservation_WhenNotFound_ThrowsKeyNotFoundException()
        {
            _userServiceMock.Setup(u => u.GetUserById(It.IsAny<Guid>()))
                .Returns(new MemberDto { FirstName = "Test", LastName = "Test", Username = "t", Email = "t@t.com" });

            var dto = new ReservationUpdateDto
            {
                ReservationId = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                SessionId = Guid.NewGuid(),
                Status = ReservationStatus.Booked
            };

            Assert.Throws<KeyNotFoundException>(() => _repository.UpdateReservation(dto));
        }

        // Brise postojecu rezervaciju i proverava da je uklonjena iz baze
        [Test]
        public void DeleteReservation_WhenExists_RemovesFromDatabase()
        {
            var reservationId = Guid.NewGuid();
            _context.Reservations.Add(new Reservation
            {
                reservationId = reservationId,
                userId = Guid.NewGuid(),
                sessionId = Guid.NewGuid(),
                status = ReservationStatus.Booked
            });
            _context.SaveChanges();

            _repository.DeleteReservation(reservationId);

            Assert.That(_context.Reservations.Count(), Is.EqualTo(0));
        }

        // Proverava da brisanje nepostojece rezervacije ne baca exception
        [Test]
        public void DeleteReservation_WhenNotFound_DoesNotThrow()
        {
            Assert.DoesNotThrow(() => _repository.DeleteReservation(Guid.NewGuid()));
        }

        // Vraca sve sesije za odredjenog korisnika na osnovu njegovih rezervacija
        [Test]
        public void GetSessionsByUserId_ReturnsCorrectSessions()
        {
            var userId = Guid.NewGuid();
            var sessionId1 = Guid.NewGuid();
            var sessionId2 = Guid.NewGuid();
            var trainerId = Guid.NewGuid();

            _context.Sessions.AddRange(
                new PersonalSession { sessionId = sessionId1, name = "Trening 1", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Upcoming, trainingType = TrainingType.Strength, trainerId = trainerId },
                new PersonalSession { sessionId = sessionId2, name = "Trening 2", StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(1), status = SessionStatus.Finished, trainingType = TrainingType.Cardio, trainerId = trainerId }
            );
            _context.Reservations.AddRange(
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = sessionId1, status = ReservationStatus.Booked },
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = sessionId2, status = ReservationStatus.Booked }
            );
            _context.SaveChanges();

            var result = _repository.GetSessionsByUserId(userId);

            Assert.That(result.Count(), Is.EqualTo(2));
        }

        // Filtrira i vraca samo predstojece sesije za korisnika (status Upcoming)
        [Test]
        public void GetUpcomingSessionsByUserId_ReturnsOnlyUpcoming()
        {
            var userId = Guid.NewGuid();
            var trainerId = Guid.NewGuid();
            var upcomingId = Guid.NewGuid();
            var finishedId = Guid.NewGuid();

            _context.Sessions.AddRange(
                new PersonalSession { sessionId = upcomingId, name = "Upcoming", StartTime = DateTime.UtcNow.AddDays(1), EndTime = DateTime.UtcNow.AddDays(1).AddHours(1), status = SessionStatus.Upcoming, trainingType = TrainingType.Yoga, trainerId = trainerId },
                new PersonalSession { sessionId = finishedId, name = "Finished", StartTime = DateTime.UtcNow.AddDays(-1), EndTime = DateTime.UtcNow.AddDays(-1).AddHours(1), status = SessionStatus.Finished, trainingType = TrainingType.Pilates, trainerId = trainerId }
            );
            _context.Reservations.AddRange(
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = upcomingId, status = ReservationStatus.Booked },
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = finishedId, status = ReservationStatus.Booked }
            );
            _context.SaveChanges();

            var result = _repository.GetUpcomingSessionsByUserId(userId);

            Assert.That(result.Count(), Is.EqualTo(1));
            Assert.That(result.First().Name, Is.EqualTo("Upcoming"));
        }

        // Vraca istoriju sesija korisnika (samo zavrsene i otkazane, ne i predstojece)
        [Test]
        public void GetSessionHistoryByUserId_ReturnsFinishedAndCanceled()
        {
            var userId = Guid.NewGuid();
            var trainerId = Guid.NewGuid();
            var finishedId = Guid.NewGuid();
            var canceledId = Guid.NewGuid();
            var upcomingId = Guid.NewGuid();

            _context.Sessions.AddRange(
                new PersonalSession { sessionId = finishedId, name = "Finished Session", StartTime = DateTime.UtcNow.AddDays(-2), EndTime = DateTime.UtcNow.AddDays(-2).AddHours(1), status = SessionStatus.Finished, trainingType = TrainingType.Boxing, trainerId = trainerId },
                new PersonalSession { sessionId = canceledId, name = "Canceled Session", StartTime = DateTime.UtcNow.AddDays(-1), EndTime = DateTime.UtcNow.AddDays(-1).AddHours(1), status = SessionStatus.Canceled, trainingType = TrainingType.HIIT, trainerId = trainerId },
                new PersonalSession { sessionId = upcomingId, name = "Upcoming Session", StartTime = DateTime.UtcNow.AddDays(1), EndTime = DateTime.UtcNow.AddDays(1).AddHours(1), status = SessionStatus.Upcoming, trainingType = TrainingType.Yoga, trainerId = trainerId }
            );
            _context.Reservations.AddRange(
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = finishedId, status = ReservationStatus.Booked },
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = canceledId, status = ReservationStatus.Booked },
                new Reservation { reservationId = Guid.NewGuid(), userId = userId, sessionId = upcomingId, status = ReservationStatus.Booked }
            );
            _context.SaveChanges();

            var result = _repository.GetSessionHistoryByUserId(userId);

            Assert.That(result.Count(), Is.EqualTo(2));
        }
    }
}
