using AutoMapper;
using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using ReservationService.Context;
using ReservationService.Data;
using ReservationService.Models;
using ReservationService.Models.DTO;
using ReservationService.Profiles;

namespace ReservationService.Tests.Unit
{
    [TestFixture]
    public class TrainingHallRepositoryTests
    {
        private ReservationContext _context = null!;
        private IMapper _mapper = null!;
        private TrainingHallRepository _repository = null!;

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
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        // Proverava da GetAll vraca praznu listu kada nema dvorana u bazi
        [Test]
        public void GetTrainingHalls_WhenEmpty_ReturnsEmptyList()
        {
            var result = _repository.GetTrainingHalls();

            Assert.That(result, Is.Not.Null);
            Assert.That(result.Count(), Is.EqualTo(0));
        }

        // Proverava da GetAll vraca sve dvorane koje postoje u bazi
        [Test]
        public void GetTrainingHalls_WhenExist_ReturnsAll()
        {
            _context.TrainingHalls.AddRange(
                new TrainingHall { trainingHallId = Guid.NewGuid(), trainingHallName = "Sala A", Capacity = 30, Description = "Velika sala" },
                new TrainingHall { trainingHallId = Guid.NewGuid(), trainingHallName = "Sala B", Capacity = 15, Description = "Mala sala" }
            );
            _context.SaveChanges();

            var result = _repository.GetTrainingHalls();

            Assert.That(result.Count(), Is.EqualTo(2));
        }

        // Vraca dvoranu po ID-u sa svim podacima (naziv, kapacitet)
        [Test]
        public void GetTrainingHallById_WhenExists_ReturnsHall()
        {
            var hallId = Guid.NewGuid();
            _context.TrainingHalls.Add(new TrainingHall
            {
                trainingHallId = hallId,
                trainingHallName = "Main Hall",
                Capacity = 50,
                Description = "Glavna dvorana"
            });
            _context.SaveChanges();

            var result = _repository.GetTrainingHallById(hallId);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.TrainingHallId, Is.EqualTo(hallId));
            Assert.That(result.TrainingHallName, Is.EqualTo("Main Hall"));
            Assert.That(result.Capacity, Is.EqualTo(50));
        }

        // Vraca null kada dvorana sa datim ID-em ne postoji
        [Test]
        public void GetTrainingHallById_WhenNotFound_ReturnsNull()
        {
            var result = _repository.GetTrainingHallById(Guid.NewGuid());

            Assert.That(result, Is.Null);
        }

        // Kreira novu dvoranu i proverava da je sacuvana u bazi
        [Test]
        public void AddTrainingHall_CreatesAndReturnsConfirmation()
        {
            var dto = new TrainingHallCreateDto
            {
                TrainingHallName = "Nova Sala",
                Description = "Potpuno nova sala",
                Capacity = 40
            };

            var result = _repository.AddTrainingHall(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.TrainingHallName, Is.EqualTo("Nova Sala"));
            Assert.That(result.Capacity, Is.EqualTo(40));
            Assert.That(_context.TrainingHalls.Count(), Is.EqualTo(1));
        }

        // Azurira naziv i kapacitet postojece dvorane i proverava promene
        [Test]
        public void UpdateTrainingHall_WhenExists_UpdatesFields()
        {
            var hallId = Guid.NewGuid();
            _context.TrainingHalls.Add(new TrainingHall
            {
                trainingHallId = hallId,
                trainingHallName = "Old Name",
                Capacity = 20,
                Description = "Stara sala"
            });
            _context.SaveChanges();

            var dto = new TrainingHallUpdateDto
            {
                TrainingHallId = hallId,
                TrainingHallName = "Updated Name",
                Description = "Renovirana sala",
                Capacity = 35
            };

            var result = _repository.UpdateTrainingHall(dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result.TrainingHallName, Is.EqualTo("Updated Name"));
            Assert.That(result.Capacity, Is.EqualTo(35));
        }

        // Proverava da update nepostojece dvorane vraca null
        [Test]
        public void UpdateTrainingHall_WhenNotFound_ReturnsNull()
        {
            var dto = new TrainingHallUpdateDto
            {
                TrainingHallId = Guid.NewGuid(),
                TrainingHallName = "Nope",
                Description = "Ne postoji",
                Capacity = 10
            };

            var result = _repository.UpdateTrainingHall(dto);

            Assert.That(result, Is.Null);
        }

        // Brise dvoranu iz baze i proverava da je uklonjena
        [Test]
        public void DeleteTrainingHall_WhenExists_RemovesFromDatabase()
        {
            var hallId = Guid.NewGuid();
            _context.TrainingHalls.Add(new TrainingHall
            {
                trainingHallId = hallId,
                trainingHallName = "To Delete",
                Capacity = 10
            });
            _context.SaveChanges();

            _repository.DeleteTrainingHall(hallId);

            Assert.That(_context.TrainingHalls.Count(), Is.EqualTo(0));
        }

        // Proverava da brisanje nepostojece dvorane ne baca exception
        [Test]
        public void DeleteTrainingHall_WhenNotFound_DoesNotThrow()
        {
            Assert.DoesNotThrow(() => _repository.DeleteTrainingHall(Guid.NewGuid()));
        }
    }
}
