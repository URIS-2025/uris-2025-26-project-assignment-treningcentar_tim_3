using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using ReservationService.Context;
using ReservationService.Controllers;
using ReservationService.Data;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Profiles;

namespace ReservationService.Tests.Integration
{
    [TestFixture]
    public class TrainingHallIntegrationTests
    {
        private ReservationContext _context = null!;
        private IMapper _mapper = null!;
        private TrainingHallRepository _repository = null!;
        private TrainingHallController _controller = null!;

        [SetUp]
        public void SetUp()
        {
            var options = new DbContextOptionsBuilder<ReservationContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new TestReservationContext(options);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<TrainingHallProfile>();
            });
            _mapper = mapperConfig.CreateMapper();

            _repository = new TrainingHallRepository(_context, _mapper);
            _controller = new TrainingHallController(_repository);
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

        // Kreira dvoranu i dohvata po ID-u
        [Test]
        public void AddTrainingHall_ThenGetById_ReturnsCreated()
        {
            var createDto = new TrainingHallCreateDto
            {
                TrainingHallName = "Main Hall",
                Description = "Velika dvorana",
                Capacity = 50
            };

            var createResult = _controller.AddTrainingHall(createDto);
            Assert.That(createResult.Result, Is.InstanceOf<CreatedAtActionResult>());
            var created = ((CreatedAtActionResult)createResult.Result!).Value as TrainingHallConfirmationDto;
            Assert.That(created, Is.Not.Null);

            var getResult = _controller.GetTrainingHallById(created!.TrainingHallId);
            Assert.That(getResult.Result, Is.InstanceOf<OkObjectResult>());
            var fetched = ((OkObjectResult)getResult.Result!).Value as TrainingHallDto;
            Assert.That(fetched!.TrainingHallName, Is.EqualTo("Main Hall"));
            Assert.That(fetched.Capacity, Is.EqualTo(50));
        }

        // Kreira dve i proverava GetAll
        [Test]
        public void AddTrainingHall_ThenGetAll_ContainsCreated()
        {
            _controller.AddTrainingHall(new TrainingHallCreateDto { TrainingHallName = "Hall A", Capacity = 30 });
            _controller.AddTrainingHall(new TrainingHallCreateDto { TrainingHallName = "Hall B", Capacity = 20 });

            var listResult = _controller.GetTrainingHalls();
            Assert.That(listResult.Result, Is.InstanceOf<OkObjectResult>());
            var halls = ((OkObjectResult)listResult.Result!).Value as IEnumerable<TrainingHallDto>;
            Assert.That(halls!.Count(), Is.EqualTo(2));
        }

        // GET /api/traininghall/{id} sa nepostojecim ID-em - ocekuje NotFound
        [Test]
        public void GetTrainingHallById_WhenNotFound_ReturnsNotFound()
        {
            var result = _controller.GetTrainingHallById(Guid.NewGuid());
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        // Kreira pa azurira naziv i kapacitet dvorane
        [Test]
        public void AddTrainingHall_ThenUpdate_ChangesFields()
        {
            var createResult = _controller.AddTrainingHall(new TrainingHallCreateDto
            {
                TrainingHallName = "Old Hall",
                Description = "Stara sala",
                Capacity = 20
            });
            var created = ((CreatedAtActionResult)createResult.Result!).Value as TrainingHallConfirmationDto;

            var updateResult = _controller.UpdateTrainingHall(new TrainingHallUpdateDto
            {
                TrainingHallId = created!.TrainingHallId,
                TrainingHallName = "New Hall",
                Description = "Renovirana",
                Capacity = 40
            });

            Assert.That(updateResult.Result, Is.InstanceOf<OkObjectResult>());
            var updated = ((OkObjectResult)updateResult.Result!).Value as TrainingHallConfirmationDto;
            Assert.That(updated!.TrainingHallName, Is.EqualTo("New Hall"));
            Assert.That(updated.Capacity, Is.EqualTo(40));

            var dbHall = _context.TrainingHalls.First(h => h.trainingHallId == created.TrainingHallId);
            Assert.That(dbHall.trainingHallName, Is.EqualTo("New Hall"));
            Assert.That(dbHall.Capacity, Is.EqualTo(40));
        }

        // PUT /api/traininghall sa nepostojecim ID-em - ocekuje NotFound
        [Test]
        public void UpdateTrainingHall_WhenNotFound_ReturnsNotFound()
        {
            var result = _controller.UpdateTrainingHall(new TrainingHallUpdateDto
            {
                TrainingHallId = Guid.NewGuid(),
                TrainingHallName = "Nope",
                Capacity = 10
            });

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        // Brise dvoranu i proverava da je uklonjena
        [Test]
        public void AddTrainingHall_ThenDelete_RemovesFromDatabase()
        {
            var createResult = _controller.AddTrainingHall(new TrainingHallCreateDto
            {
                TrainingHallName = "To Delete",
                Capacity = 15
            });
            var created = ((CreatedAtActionResult)createResult.Result!).Value as TrainingHallConfirmationDto;

            var deleteResult = _controller.DeleteTrainingHall(created!.TrainingHallId);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());

            Assert.That(_context.TrainingHalls.Count(), Is.EqualTo(0));
        }

        // Kompletan zivotni ciklus dvorane: POST -> PUT -> DELETE
        [Test]
        public void FullTrainingHallLifecycle_Create_Update_Delete()
        {
            // Create
            var createResult = _controller.AddTrainingHall(new TrainingHallCreateDto
            {
                TrainingHallName = "Lifecycle Hall",
                Description = "Test lifecycle",
                Capacity = 30
            });
            var created = ((CreatedAtActionResult)createResult.Result!).Value as TrainingHallConfirmationDto;
            Assert.That(created!.TrainingHallName, Is.EqualTo("Lifecycle Hall"));

            // Update
            var updateResult = _controller.UpdateTrainingHall(new TrainingHallUpdateDto
            {
                TrainingHallId = created.TrainingHallId,
                TrainingHallName = "Updated Lifecycle",
                Description = "Updated desc",
                Capacity = 50
            });
            var updated = ((OkObjectResult)updateResult.Result!).Value as TrainingHallConfirmationDto;
            Assert.That(updated!.TrainingHallName, Is.EqualTo("Updated Lifecycle"));
            Assert.That(updated.Capacity, Is.EqualTo(50));

            // Delete
            var deleteResult = _controller.DeleteTrainingHall(created.TrainingHallId);
            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());
            Assert.That(_context.TrainingHalls.Count(), Is.EqualTo(0));
        }
    }
}
