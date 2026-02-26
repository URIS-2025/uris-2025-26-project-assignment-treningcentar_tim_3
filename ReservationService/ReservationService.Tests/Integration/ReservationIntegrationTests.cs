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
    public class ReservationIntegrationTests
    {
        private ReservationContext _context = null!;
        private IMapper _mapper = null!;
        private Mock<IUserService> _userServiceMock = null!;
        private Mock<IServiceLogger> _loggerMock = null!;
        private ReservationRepository _repository = null!;
        private ReservationController _controller = null!;

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
                cfg.AddProfile<TrainingHallProfile>();
            });
            _mapper = mapperConfig.CreateMapper();

            _userServiceMock = new Mock<IUserService>();
            _loggerMock = new Mock<IServiceLogger>();
            _loggerMock.Setup(l => l.CreateLog(It.IsAny<LogCreationDto>()))
                .Returns((LogDto)null!);

            _repository = new ReservationRepository(_context, _mapper, _userServiceMock.Object, _loggerMock.Object);
            _controller = new ReservationController(_repository, _mapper);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // Kreira i zatim dohvata po ID-u
        [Test]
        public void CreateReservation_ThenGetById_ReturnsCreated()
        {
            var userId = Guid.NewGuid();
            var sessionId = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Marko", LastName = "Markovic", Username = "marko", Email = "marko@test.com" });

            var createDto = new ReservationCreateDto { UserId = userId, SessionId = sessionId };

            var createResult = _controller.Create(createDto);
            Assert.That(createResult.Result, Is.InstanceOf<CreatedResult>());
            var created = ((CreatedResult)createResult.Result!).Value as ReservationConfirmationDto;
            Assert.That(created, Is.Not.Null);
            Assert.That(created!.UserName, Is.EqualTo("Marko Markovic"));

            var dbReservation = _context.Reservations.First();
            var getResult = _controller.GetById(dbReservation.reservationId);
            Assert.That(getResult.Result, Is.InstanceOf<OkObjectResult>());
            var fetched = ((OkObjectResult)getResult.Result!).Value as ReservationDto;
            Assert.That(fetched, Is.Not.Null);
            Assert.That(fetched!.SessionId, Is.EqualTo(sessionId));
        }

        // Kreira dve i proverava da GetAll vraca obe
        [Test]
        public void CreateReservation_ThenGetAll_ContainsCreated()
        {
            var userId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Ana", LastName = "Anic", Username = "ana", Email = "ana@test.com" });

            _controller.Create(new ReservationCreateDto { UserId = userId, SessionId = Guid.NewGuid() });
            _controller.Create(new ReservationCreateDto { UserId = userId, SessionId = Guid.NewGuid() });

            var listResult = _controller.GetAll();
            Assert.That(listResult.Result, Is.InstanceOf<OkObjectResult>());
            var reservations = ((OkObjectResult)listResult.Result!).Value as IEnumerable<ReservationDto>;
            Assert.That(reservations!.Count(), Is.EqualTo(2));
        }

        // POST /api/reservation sa nepostojecim korisnikom - ocekuje NotFound
        [Test]
        public void CreateReservation_WithInvalidUser_ReturnsNotFound()
        {
            _userServiceMock.Setup(u => u.GetUserById(It.IsAny<Guid>()))
                .Returns((MemberDto)null!);

            var dto = new ReservationCreateDto { UserId = Guid.NewGuid(), SessionId = Guid.NewGuid() };
            var result = _controller.Create(dto);

            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        // Kreira pa azurira sesiju i status
        [Test]
        public void CreateReservation_ThenUpdate_ChangesSessionAndStatus()
        {
            var userId = Guid.NewGuid();
            var sessionId1 = Guid.NewGuid();
            var sessionId2 = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Petar", LastName = "Petrovic", Username = "petar", Email = "petar@test.com" });

            _controller.Create(new ReservationCreateDto { UserId = userId, SessionId = sessionId1 });
            var reservationId = _context.Reservations.First().reservationId;

            var updateDto = new ReservationUpdateDto
            {
                ReservationId = reservationId,
                UserId = userId,
                SessionId = sessionId2,
                Status = ReservationStatus.Canceled
            };

            var updateResult = _controller.Update(reservationId, updateDto);
            Assert.That(updateResult.Result, Is.InstanceOf<OkObjectResult>());

            var dbReservation = _context.Reservations.First(r => r.reservationId == reservationId);
            Assert.That(dbReservation.sessionId, Is.EqualTo(sessionId2));
            Assert.That(dbReservation.status, Is.EqualTo(ReservationStatus.Canceled));
        }

        // PUT /api/reservation/{id} sa nepostojecim ID-em - ocekuje NotFound
        [Test]
        public void UpdateReservation_WhenNotFound_ReturnsNotFound()
        {
            var fakeId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(It.IsAny<Guid>()))
                .Returns(new MemberDto { FirstName = "T", LastName = "T", Username = "t", Email = "t@t.com" });

            var updateDto = new ReservationUpdateDto
            {
                ReservationId = fakeId,
                UserId = Guid.NewGuid(),
                SessionId = Guid.NewGuid(),
                Status = ReservationStatus.Booked
            };

            var result = _controller.Update(fakeId, updateDto);
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        // Brise i proverava da vise ne postoji
        [Test]
        public void CreateReservation_ThenDelete_ThenGetById_ReturnsNotFound()
        {
            var userId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Test", LastName = "User", Username = "test", Email = "test@test.com" });

            _controller.Create(new ReservationCreateDto { UserId = userId, SessionId = Guid.NewGuid() });
            var reservationId = _context.Reservations.First().reservationId;

            var deleteResult = _controller.Delete(reservationId);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());

            var getResult = _controller.GetById(reservationId);
            Assert.That(getResult.Result, Is.InstanceOf<NotFoundResult>());
            Assert.That(_context.Reservations.Count(), Is.EqualTo(0));
        }

        // DELETE /api/reservation/{id} sa nepostojecim ID-em - ocekuje NotFound
        [Test]
        public void DeleteReservation_WhenNotFound_ReturnsNotFound()
        {
            var result = _controller.Delete(Guid.NewGuid());
            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        // GET /api/reservation kada je baza prazna - ocekuje NoContent
        [Test]
        public void GetAll_WhenEmpty_ReturnsNoContent()
        {
            var result = _controller.GetAll();
            Assert.That(result.Result, Is.InstanceOf<NoContentResult>());
        }

        // Kompletan zivotni ciklus rezervacije POST -> PUT -> DELETE
        [Test]
        public void FullReservationLifecycle_Create_Update_Delete()
        {
            var userId = Guid.NewGuid();
            var sessionId = Guid.NewGuid();
            var newSessionId = Guid.NewGuid();

            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Lifecycle", LastName = "User", Username = "lc", Email = "lc@test.com" });

            // Create
            var createResult = _controller.Create(new ReservationCreateDto { UserId = userId, SessionId = sessionId });
            Assert.That(createResult.Result, Is.InstanceOf<CreatedResult>());
            var reservationId = _context.Reservations.First().reservationId;

            // Update
            var updateResult = _controller.Update(reservationId, new ReservationUpdateDto
            {
                ReservationId = reservationId,
                UserId = userId,
                SessionId = newSessionId,
                Status = ReservationStatus.Canceled
            });
            Assert.That(updateResult.Result, Is.InstanceOf<OkObjectResult>());

            // Verify update in db
            var updated = _context.Reservations.First(r => r.reservationId == reservationId);
            Assert.That(updated.status, Is.EqualTo(ReservationStatus.Canceled));
            Assert.That(updated.sessionId, Is.EqualTo(newSessionId));

            // Delete
            var deleteResult = _controller.Delete(reservationId);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());
            Assert.That(_context.Reservations.Count(), Is.EqualTo(0));
        }

        // Kreira 3 rezervacije i proverava da GetAll vraca tacan broj
        [Test]
        public void CreateMultipleReservations_GetAll_ReturnsCorrectCount()
        {
            var userId = Guid.NewGuid();
            _userServiceMock.Setup(u => u.GetUserById(userId))
                .Returns(new MemberDto { FirstName = "Multi", LastName = "User", Username = "mu", Email = "mu@test.com" });

            _controller.Create(new ReservationCreateDto { UserId = userId, SessionId = Guid.NewGuid() });
            _controller.Create(new ReservationCreateDto { UserId = userId, SessionId = Guid.NewGuid() });
            _controller.Create(new ReservationCreateDto { UserId = userId, SessionId = Guid.NewGuid() });

            var result = _controller.GetAll();
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var list = ((OkObjectResult)result.Result!).Value as IEnumerable<ReservationDto>;
            Assert.That(list!.Count(), Is.EqualTo(3));
        }
    }
}
